import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { UserManagementComponent } from './user-management.component';

@NgModule({ declarations: [UserManagementComponent], imports: [SharedModule, RouterModule.forChild([{ path: '', component: UserManagementComponent }])] })
export class UserManagementModule {}
