import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanParticipantComponent } from './scan-participant.component';

describe('ScanParticipantComponent', () => {
  let component: ScanParticipantComponent;
  let fixture: ComponentFixture<ScanParticipantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScanParticipantComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ScanParticipantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
