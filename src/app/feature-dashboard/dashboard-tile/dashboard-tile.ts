import { httpResource } from '@angular/common/http';
import { Component, computed, input } from '@angular/core';
import {
  DataModelResponse,
  toDataModelRequest,
  withDataModel,
} from '../../data/a2ui-data-model';
import { A2uiSurface } from '../../shared/a2ui-surface';
import { DashboardItem } from '../dashboard-store/dashboard-model';

@Component({
  selector: 'app-dashboard-tile',
  imports: [A2uiSurface],
  template: `<app-a2ui-surface [operations]="operations()" />`,
})
export class DashboardTile {
  readonly item = input.required<DashboardItem>();

  private readonly expression = computed(() => this.item().expression);

  private readonly dataModel = httpResource<DataModelResponse>(() =>
    toDataModelRequest(this.expression()),
  );

  protected readonly operations = computed(() =>
    withDataModel(this.item().messages, this.dataModel.value()),
  );
}
