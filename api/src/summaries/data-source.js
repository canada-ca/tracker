import { loadChartSummariesByPeriod } from './loaders'

export class SummariesDataSource {
  constructor({ query, userKey, cleanseInput, i18n }) {
    this.getConnectionsByPeriod = loadChartSummariesByPeriod({ query, userKey, cleanseInput, i18n })
  }
}
