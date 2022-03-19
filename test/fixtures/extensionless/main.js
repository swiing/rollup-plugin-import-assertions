import config from './config' assert { type: 'json' };
import questions from './dir' assert { type: 'json' };

t.is(config.answer, 42);
t.is(questions['Are extensionless imports and /index resolutions a good idea?'], 'No.');
