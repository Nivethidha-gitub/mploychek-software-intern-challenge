import fs from 'fs';
import path from 'path';
import { Db, MongoClient } from 'mongodb';
import { CreateTableCommand, DescribeTableCommand, DynamoDBClient, waitUntilTableExists } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { seedRecords, seedUsers } from './seed';

export type Role = 'General User' | 'Admin';
export interface User { id: string; name: string; email: string; password: string; role: Role; status: 'Active' | 'Inactive'; }
export interface Rec { id: string; description: string; status: string; ownerId: string; level: number; } // level: 1 Public, 2 Internal, 3 Restricted

/** Storage contract. Swap implementations without touching routes (Mongo today, DynamoDB tomorrow). */
export interface Repo {
  users(): Promise<User[]>;
  user(id: string): Promise<User | null>;
  addUser(u: User): Promise<void>;
  updateUser(id: string, patch: Partial<User>): Promise<User | null>;
  deleteUser(id: string): Promise<boolean>;
  records(ownerId?: string): Promise<Rec[]>;
}

class JsonRepo implements Repo {
  private d: { users: User[]; records: Rec[] };
  constructor(private file: string) {
    this.d = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { users: seedUsers(), records: seedRecords() };
    this.save();
  }
  private save() { fs.mkdirSync(path.dirname(this.file), { recursive: true }); fs.writeFileSync(this.file, JSON.stringify(this.d, null, 2)); }
  async users() { return this.d.users; }
  async user(id: string) { return this.d.users.find(u => u.id === id) || null; }
  async addUser(u: User) { this.d.users.push(u); this.save(); }
  async updateUser(id: string, p: Partial<User>) {
    const u = this.d.users.find(x => x.id === id); if (!u) return null;
    Object.assign(u, p); this.save(); return u;
  }
  async deleteUser(id: string) {
    const n = this.d.users.length;
    this.d.users = this.d.users.filter(u => u.id !== id); this.d.records = this.d.records.filter(r => r.ownerId !== id);
    this.save(); return this.d.users.length < n;
  }
  async records(ownerId?: string) { return ownerId ? this.d.records.filter(r => r.ownerId === ownerId) : this.d.records; }
}

class MongoRepo implements Repo {
  private constructor(private db: Db) {}
  static async connect(uri: string) {
    const db = (await new MongoClient(uri).connect()).db();
    if (!(await db.collection('users').countDocuments())) {
      await db.collection('users').insertMany(seedUsers() as any[]);
      await db.collection('records').insertMany(seedRecords() as any[]);
    }
    await db.collection('users').createIndex({ id: 1 }, { unique: true });
    return new MongoRepo(db);
  }
  private p = { projection: { _id: 0 } };
  private get U() { return this.db.collection<User>('users'); }
  async users() { return this.U.find({}, this.p).toArray() as Promise<User[]>; }
  async user(id: string) { return (await this.U.findOne({ id }, this.p)) as User | null; }
  async addUser(u: User) { await this.U.insertOne({ ...u }); }
  async updateUser(id: string, patch: Partial<User>) {
    await this.U.updateOne({ id }, { $set: patch }); return this.user(id);
  }
  async deleteUser(id: string) {
    await this.db.collection('records').deleteMany({ ownerId: id });
    return (await this.U.deleteOne({ id })).deletedCount === 1;
  }
  async records(ownerId?: string) {
    return this.db.collection('records').find(ownerId ? { ownerId } : {}, this.p).toArray() as unknown as Promise<Rec[]>;
  }
}


/** AWS DynamoDB storage. Set STORAGE=dynamodb. Use DYNAMO_ENDPOINT for DynamoDB Local; tables are created on first start. */
class DynamoRepo implements Repo {
  private constructor(private d: DynamoDBDocumentClient, private U: string, private R: string) {}
  static async connect() {
    const local = process.env.DYNAMO_ENDPOINT;
    const raw = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1',
      ...(local ? { endpoint: local, credentials: { accessKeyId: 'local', secretAccessKey: 'local' } } : {}) });
    const prefix = process.env.DYNAMO_PREFIX || 'accessledger_';
    const [U, R] = [prefix + 'users', prefix + 'records'];
    for (const t of [U, R]) {
      try { await raw.send(new DescribeTableCommand({ TableName: t })); } catch {
        await raw.send(new CreateTableCommand({ TableName: t, BillingMode: 'PAY_PER_REQUEST',
          KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }], AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }] }));
        await waitUntilTableExists({ client: raw, maxWaitTime: 60 }, { TableName: t });
      }
    }
    const repo = new DynamoRepo(DynamoDBDocumentClient.from(raw), U, R);
    if (!(await repo.users()).length) {
      for (const u of seedUsers()) await repo.addUser(u);
      for (const x of seedRecords()) await repo.d.send(new PutCommand({ TableName: R, Item: x }));
    }
    return repo;
  }
  private async scan<T>(TableName: string) {
    const out: T[] = []; let key: Record<string, any> | undefined;
    do { const r = await this.d.send(new ScanCommand({ TableName, ExclusiveStartKey: key })); out.push(...((r.Items || []) as T[])); key = r.LastEvaluatedKey; } while (key);
    return out;
  }
  users() { return this.scan<User>(this.U); }
  async user(id: string) { return ((await this.d.send(new GetCommand({ TableName: this.U, Key: { id } }))).Item as User) || null; }
  async addUser(u: User) { await this.d.send(new PutCommand({ TableName: this.U, Item: u })); }
  async updateUser(id: string, patch: Partial<User>) {
    const u = await this.user(id); if (!u) return null;
    const n = { ...u, ...patch }; await this.addUser(n); return n;
  }
  async deleteUser(id: string) {
    if (!(await this.user(id))) return false;
    for (const r of await this.records(id)) await this.d.send(new DeleteCommand({ TableName: this.R, Key: { id: r.id } }));
    await this.d.send(new DeleteCommand({ TableName: this.U, Key: { id } })); return true;
  }
  async records(ownerId?: string) {
    const all = await this.scan<Rec>(this.R);
    return (ownerId ? all.filter(r => r.ownerId === ownerId) : all).sort((a, b) => a.id.localeCompare(b.id));
  }
}

export async function makeRepo(): Promise<Repo> {
  if (process.env.STORAGE === 'dynamodb') { console.log('Storage: AWS DynamoDB'); return DynamoRepo.connect(); }
  const uri = process.env.MONGO_URI;
  if (uri) { console.log('Storage: MongoDB'); return MongoRepo.connect(uri); }
  console.log('Storage: local JSON file (set MONGO_URI for MongoDB or STORAGE=dynamodb for AWS)');
  return new JsonRepo(path.join(__dirname, '../data/db.json'));
}
