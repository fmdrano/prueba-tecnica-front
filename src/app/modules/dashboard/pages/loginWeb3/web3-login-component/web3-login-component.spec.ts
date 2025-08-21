import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Web3LoginComponent } from './web3-login-component';

describe('Web3LoginComponent', () => {
  let component: Web3LoginComponent;
  let fixture: ComponentFixture<Web3LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Web3LoginComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Web3LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
