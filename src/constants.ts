import { version } from '../package.json';

export const VERSION = version;
export const LAST_STABLE = '0.2.6';

export const CONFIG = {
  FRAME_WIDTH: 600,
  FRAME_HEIGHT: 400,
  FRAME_NAME: 'Documentation',
  TEXT_SIZE: 14,
  PADDING: 20,
  SPACING: 16,
  PROCESS_DELAY: 100,
  BATCH_SIZE: 50
} as const;