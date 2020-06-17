const { join } = require('path');
const dirToObject = require('../src');

describe('dirToObject', () => {
  const dirPath = join(__dirname, '../__mocks__/foo');

  describe('v1', () => {
    const scenarios = [
      {
        config: { dirPath },
        description: 'config w/ dirPath only'
      },
      {
        config: {
          canAdd: data => data.resolve && data.type,
          dirPath
        },
        description: 'config w/ canAdd and dirPath'
      }
    ];

    scenarios.forEach(({ config, description }) => {
      it(description, () => {
        expect(dirToObject(config)).toMatchSnapshot();
      });
    });
  });

  describe('v2', () => {
    const scenarios = [
      {
        description: 'w/ path only',
        path: dirPath
      },
      {
        description: 'w/ path and options',
        options: {
          canAdd: data => data.resolve && data.type
        },
        path: dirPath
      }
    ];

    scenarios.forEach(({ description, options, path }) => {
      it(description, () => {
        expect(dirToObject(path, options)).toMatchSnapshot();
      });
    });
  });
});
