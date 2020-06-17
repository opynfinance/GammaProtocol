# dir-to-object

> Builds an object from the files contained inside a directory.

## Installation

```bash
npm install dir-to-object
```

## Usage example

```bash
const dirToObject = require('dir-to-object');
const { join } = require('path');

const path = join(__dirname, './__mocks__/foo');

const options = { canAdd: () => true };

const bar = dirToObject(path, options);

console.log(bar);
```

Where **path** is a string and it is required:

> e.g.: `join(__dirname, './foo')`

And where **config** is an object with the following property:

| name   | type                          | example                             | required or optional |
| ------ | ----------------------------- | ----------------------------------- | -------------------- |
| canAdd | _function_: (data) => boolean | `data => data.resolve && data.type` | _optional_           |

## Contributing

1. [Fork it](https://github.com/mattiaerre/dir-to-object/fork)
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -am 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Create a new Pull Request

## License

Distributed under the MIT license. See [LICENSE](LICENSE) for more information.
