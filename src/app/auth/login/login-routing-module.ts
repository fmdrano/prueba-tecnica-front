import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Web3LoginComponent } from '../../modules/dashboard/pages/loginWeb3/web3-login-component/web3-login-component';

const routes: Routes = [
   {
    path: 'login',
    component: Login

  },
  {
    path: 'web3',
    component: Web3LoginComponent

  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LoginRoutingModule { }
