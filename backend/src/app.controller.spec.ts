import {
  describe,
  expect,
  it,
} from 'vitest';

import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  const appService = new AppService();
  const controller = new AppController(
    appService,
  );

  it('should return health status', () => {
    const result = controller.getHealth();

    expect(result.status).toBe('ok');

    expect(result.service).toBe(
      'internal-operations-service-hub',
    );

    expect(result.timestamp).toBeTruthy();

    expect(
      Number.isNaN(
        Date.parse(result.timestamp),
      ),
    ).toBe(false);
  });
});