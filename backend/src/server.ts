import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { makeRepo, User } from './repo';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ROLES = ['General User', 'Admin'];
const STATUSES = ['Active', 'Inactive'];
const LEVELS = ['', 'Public', 'Internal', 'Restricted'];
const ACCESS = ['', 'Public only', 'Internal', 'Full'];
const levelOf = (u: { role: string }) => (u.role === 'Admin' ? 3 : 1); // clearance comes from the role
const pub = ({ password, ...u }: User) => ({ ...u, accessLevel: levelOf(u), accessName: ACCESS[levelOf(u)] });
const bad = (res: Response, code: number, message: string) => res.status(code).json({ message });
const wrap = (h: (q: any, r: Response) => Promise<unknown>) => (q: Request, r: Response, n: NextFunction) => h(q, r).catch(n);

async function main() {
  const repo = await makeRepo();
  const app = express();
  app.use(cors(), express.json());

  // Simulated latency on every route: ?delay=<ms>, capped at 10 s
  app.use((req, _res, next) => setTimeout(next, Math.min(Number(req.query.delay) || 0, 10000)));

  const auth = async (req: any, res: Response, next: NextFunction) => {
    try {
      const p: any = jwt.verify((req.headers.authorization || '').slice(7), SECRET);
      const u = await repo.user(p.sub);
      if (!u || u.status !== 'Active') throw new Error('inactive');
      req.user = u; next();
    } catch { bad(res, 401, 'Session expired. Sign in again.'); }
  };
  const admin = (req: any, res: Response, next: NextFunction) => (req.user.role === 'Admin' ? next() : bad(res, 403, 'Admins only.'));

  app.post('/api/auth/login', wrap(async (req, res) => {
    const { userId, password, role } = req.body || {};
    const u = userId && (await repo.user(String(userId)));
    if (!u || !(await bcrypt.compare(String(password || ''), u.password)) || u.role !== role) return bad(res, 401, 'User ID, password or role is incorrect.');
    if (u.status !== 'Active') return bad(res, 403, 'This account is inactive. Contact an administrator.');
    res.json({ token: jwt.sign({ sub: u.id, role: u.role }, SECRET, { expiresIn: '2h' }), user: pub(u) });
  }));

  app.get('/api/users/me', auth, (req: any, res) => res.json(pub(req.user)));
  // Server-side access control: records above the caller's clearance are returned masked, never in full.
  app.get('/api/records', auth, wrap(async (req, res) => {
    const lvl = levelOf(req.user);
    const rows = await repo.records(req.user.role === 'Admin' ? undefined : req.user.id);
    res.json(rows.map(r => { const level = r.level || 1; const accessible = level <= lvl;
      return { ...r, level, levelName: LEVELS[level], accessible, description: accessible ? r.description : 'Restricted record' }; }));
  }));

  app.get('/api/users', auth, admin, wrap(async (_q, res) => res.json((await repo.users()).map(pub))));
  app.post('/api/users', auth, admin, wrap(async (req, res) => {
    const { id, name, email, password, role } = req.body || {};
    if (!id || !name || !/^\S+@\S+\.\S+$/.test(email || '') || (password || '').length < 6 || !ROLES.includes(role))
      return bad(res, 400, 'Enter an ID, a name, a valid email, a password of 6+ characters, and a role.');
    if (await repo.user(id)) return bad(res, 409, 'That user ID is already taken.');
    const u: User = { id, name, email, password: await bcrypt.hash(password, 8), role, status: 'Active' };
    await repo.addUser(u); res.status(201).json(pub(u));
  }));
  app.put('/api/users/:id', auth, admin, wrap(async (req, res) => {
    const b = req.body || {}; const patch: Partial<User> = {};
    if (b.name) patch.name = b.name;
    if (b.email) { if (!/^\S+@\S+\.\S+$/.test(b.email)) return bad(res, 400, 'Enter a valid email.'); patch.email = b.email; }
    if (b.role) { if (!ROLES.includes(b.role)) return bad(res, 400, 'Unknown role.'); patch.role = b.role; }
    if (b.status) { if (!STATUSES.includes(b.status)) return bad(res, 400, 'Unknown status.'); patch.status = b.status; }
    if (b.password) { if (b.password.length < 6) return bad(res, 400, 'Password needs 6+ characters.'); patch.password = await bcrypt.hash(b.password, 8); }
    if (req.params.id === req.user.id && (patch.status === 'Inactive' || (patch.role && patch.role !== 'Admin')))
      return bad(res, 400, 'You cannot deactivate or demote your own account.');
    const u = await repo.updateUser(req.params.id, patch);
    u ? res.json(pub(u)) : bad(res, 404, 'User not found.');
  }));
  app.delete('/api/users/:id', auth, admin, wrap(async (req, res) => {
    if (req.params.id === req.user.id) return bad(res, 400, 'You cannot delete your own account.');
    (await repo.deleteUser(req.params.id)) ? res.json({ ok: true }) : bad(res, 404, 'User not found.');
  }));

  app.use((e: Error, _q: Request, res: Response, _n: NextFunction) => { console.error(e); bad(res, 500, 'Server error. Try again.'); });
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => console.log(`API on http://localhost:${port}`));
}
main().catch(e => { console.error(e); process.exit(1); });
