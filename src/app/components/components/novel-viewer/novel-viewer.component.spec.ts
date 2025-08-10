import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovelViewerComponent } from './novel-viewer.component';

describe('NovelViewerComponent', () => {
  let component: NovelViewerComponent;
  let fixture: ComponentFixture<NovelViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovelViewerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NovelViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
