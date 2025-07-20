import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Principal } from './pages/principal/principal';
import { Home } from '../../layout/home/home';
import { Admin } from './pages/admin/admin';


const routes: Routes = [
  {
    path: '', component: Principal,
    children: [
      {
        path: 'home',
        component: Home
      },
      {
        path: 'admin',
        component: Admin
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },

    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
