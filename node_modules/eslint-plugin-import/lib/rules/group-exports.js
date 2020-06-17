'use strict';

var _docsUrl = require('../docsUrl');

var _docsUrl2 = _interopRequireDefault(_docsUrl);

var _object = require('object.values');

var _object2 = _interopRequireDefault(_object);

var _arrayPrototype = require('array.prototype.flat');

var _arrayPrototype2 = _interopRequireDefault(_arrayPrototype);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const meta = {
  type: 'suggestion',
  docs: {
    url: (0, _docsUrl2.default)('group-exports')
  }
  /* eslint-disable max-len */
};const errors = {
  ExportNamedDeclaration: 'Multiple named export declarations; consolidate all named exports into a single export declaration',
  AssignmentExpression: 'Multiple CommonJS exports; consolidate all exports into a single assignment to `module.exports`'
  /* eslint-enable max-len */

  /**
   * Returns an array with names of the properties in the accessor chain for MemberExpression nodes
   *
   * Example:
   *
   * `module.exports = {}` => ['module', 'exports']
   * `module.exports.property = true` => ['module', 'exports', 'property']
   *
   * @param     {Node}    node    AST Node (MemberExpression)
   * @return    {Array}           Array with the property names in the chain
   * @private
   */
};function accessorChain(node) {
  const chain = [];

  do {
    chain.unshift(node.property.name);

    if (node.object.type === 'Identifier') {
      chain.unshift(node.object.name);
      break;
    }

    node = node.object;
  } while (node.type === 'MemberExpression');

  return chain;
}

function create(context) {
  const nodes = {
    modules: {
      set: new Set(),
      sources: {}
    },
    types: {
      set: new Set(),
      sources: {}
    },
    commonjs: {
      set: new Set()
    }
  };

  return {
    ExportNamedDeclaration(node) {
      let target = node.exportKind === 'type' ? nodes.types : nodes.modules;
      if (!node.source) {
        target.set.add(node);
      } else if (Array.isArray(target.sources[node.source.value])) {
        target.sources[node.source.value].push(node);
      } else {
        target.sources[node.source.value] = [node];
      }
    },

    AssignmentExpression(node) {
      if (node.left.type !== 'MemberExpression') {
        return;
      }

      const chain = accessorChain(node.left);

      // Assignments to module.exports
      // Deeper assignments are ignored since they just modify what's already being exported
      // (ie. module.exports.exported.prop = true is ignored)
      if (chain[0] === 'module' && chain[1] === 'exports' && chain.length <= 3) {
        nodes.commonjs.set.add(node);
        return;
      }

      // Assignments to exports (exports.* = *)
      if (chain[0] === 'exports' && chain.length === 2) {
        nodes.commonjs.set.add(node);
        return;
      }
    },

    'Program:exit': function onExit() {
      // Report multiple `export` declarations (ES2015 modules)
      if (nodes.modules.set.size > 1) {
        nodes.modules.set.forEach(node => {
          context.report({
            node,
            message: errors[node.type]
          });
        });
      }

      // Report multiple `aggregated exports` from the same module (ES2015 modules)
      (0, _arrayPrototype2.default)((0, _object2.default)(nodes.modules.sources).filter(nodesWithSource => Array.isArray(nodesWithSource) && nodesWithSource.length > 1)).forEach(node => {
        context.report({
          node,
          message: errors[node.type]
        });
      });

      // Report multiple `export type` declarations (FLOW ES2015 modules)
      if (nodes.types.set.size > 1) {
        nodes.types.set.forEach(node => {
          context.report({
            node,
            message: errors[node.type]
          });
        });
      }

      // Report multiple `aggregated type exports` from the same module (FLOW ES2015 modules)
      (0, _arrayPrototype2.default)((0, _object2.default)(nodes.types.sources).filter(nodesWithSource => Array.isArray(nodesWithSource) && nodesWithSource.length > 1)).forEach(node => {
        context.report({
          node,
          message: errors[node.type]
        });
      });

      // Report multiple `module.exports` assignments (CommonJS)
      if (nodes.commonjs.set.size > 1) {
        nodes.commonjs.set.forEach(node => {
          context.report({
            node,
            message: errors[node.type]
          });
        });
      }
    }
  };
}

module.exports = {
  meta,
  create
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9ncm91cC1leHBvcnRzLmpzIl0sIm5hbWVzIjpbIm1ldGEiLCJ0eXBlIiwiZG9jcyIsInVybCIsImVycm9ycyIsIkV4cG9ydE5hbWVkRGVjbGFyYXRpb24iLCJBc3NpZ25tZW50RXhwcmVzc2lvbiIsImFjY2Vzc29yQ2hhaW4iLCJub2RlIiwiY2hhaW4iLCJ1bnNoaWZ0IiwicHJvcGVydHkiLCJuYW1lIiwib2JqZWN0IiwiY3JlYXRlIiwiY29udGV4dCIsIm5vZGVzIiwibW9kdWxlcyIsInNldCIsIlNldCIsInNvdXJjZXMiLCJ0eXBlcyIsImNvbW1vbmpzIiwidGFyZ2V0IiwiZXhwb3J0S2luZCIsInNvdXJjZSIsImFkZCIsIkFycmF5IiwiaXNBcnJheSIsInZhbHVlIiwicHVzaCIsImxlZnQiLCJsZW5ndGgiLCJvbkV4aXQiLCJzaXplIiwiZm9yRWFjaCIsInJlcG9ydCIsIm1lc3NhZ2UiLCJmaWx0ZXIiLCJub2Rlc1dpdGhTb3VyY2UiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBRUEsTUFBTUEsT0FBTztBQUNYQyxRQUFNLFlBREs7QUFFWEMsUUFBTTtBQUNKQyxTQUFLLHVCQUFRLGVBQVI7QUFERDtBQUlSO0FBTmEsQ0FBYixDQU9BLE1BQU1DLFNBQVM7QUFDYkMsMEJBQXdCLG9HQURYO0FBRWJDLHdCQUFzQjtBQUV4Qjs7QUFFQTs7Ozs7Ozs7Ozs7O0FBTmUsQ0FBZixDQWtCQSxTQUFTQyxhQUFULENBQXVCQyxJQUF2QixFQUE2QjtBQUMzQixRQUFNQyxRQUFRLEVBQWQ7O0FBRUEsS0FBRztBQUNEQSxVQUFNQyxPQUFOLENBQWNGLEtBQUtHLFFBQUwsQ0FBY0MsSUFBNUI7O0FBRUEsUUFBSUosS0FBS0ssTUFBTCxDQUFZWixJQUFaLEtBQXFCLFlBQXpCLEVBQXVDO0FBQ3JDUSxZQUFNQyxPQUFOLENBQWNGLEtBQUtLLE1BQUwsQ0FBWUQsSUFBMUI7QUFD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LEdBQXVCLENBQTNCLEVBQThCO0FBQzVCbEIsY0FBTUssS0FBTixDQUFZSCxHQUFaLENBQWdCaUIsT0FBaEIsQ0FBd0IzQixRQUFRO0FBQzlCTyxrQkFBUXFCLE1BQVIsQ0FBZTtBQUNiNUIsZ0JBRGE7QUFFYjZCLHFCQUFTakMsT0FBT0ksS0FBS1AsSUFBWjtBQUZJLFdBQWY7QUFJRCxTQUxEO0FBTUQ7O0FBRUQ7QUFDQSxvQ0FBSyxzQkFBT2UsTUFBTUssS0FBTixDQUFZRCxPQUFuQixFQUNGa0IsTUFERSxDQUNLQyxtQkFBbUJaLE1BQU1DLE9BQU4sQ0FBY1csZUFBZCxLQUFrQ0EsZ0JBQWdCUCxNQUFoQixHQUF5QixDQURuRixDQUFMLEVBRUdHLE9BRkgsQ0FFWTNCLElBQUQsSUFBVTtBQUNqQk8sZ0JBQVFxQixNQUFSLENBQWU7QUFDYjVCLGNBRGE7QUFFYjZCLG1CQUFTakMsT0FBT0ksS0FBS1AsSUFBWjtBQUZJLFNBQWY7QUFJRCxPQVBIOztBQVNBO0FBQ0EsVUFBSWUsTUFBTU0sUUFBTixDQUFlSixHQUFmLENBQW1CZ0IsSUFBbkIsR0FBMEIsQ0FBOUIsRUFBaUM7QUFDL0JsQixjQUFNTSxRQUFOLENBQWVKLEdBQWYsQ0FBbUJpQixPQUFuQixDQUEyQjNCLFFBQVE7QUFDakNPLGtCQUFRcUIsTUFBUixDQUFlO0FBQ2I1QixnQkFEYTtBQUViNkIscUJBQVNqQyxPQUFPSSxLQUFLUCxJQUFaO0FBRkksV0FBZjtBQUlELFNBTEQ7QUFNRDtBQUNGO0FBcEZJLEdBQVA7QUFzRkQ7O0FBRUR1QyxPQUFPQyxPQUFQLEdBQWlCO0FBQ2Z6QyxNQURlO0FBRWZjO0FBRmUsQ0FBakIiLCJmaWxlIjoiZ3JvdXAtZXhwb3J0cy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBkb2NzVXJsIGZyb20gJy4uL2RvY3NVcmwnXG5pbXBvcnQgdmFsdWVzIGZyb20gJ29iamVjdC52YWx1ZXMnXG5pbXBvcnQgZmxhdCBmcm9tICdhcnJheS5wcm90b3R5cGUuZmxhdCdcblxuY29uc3QgbWV0YSA9IHtcbiAgdHlwZTogJ3N1Z2dlc3Rpb24nLFxuICBkb2NzOiB7XG4gICAgdXJsOiBkb2NzVXJsKCdncm91cC1leHBvcnRzJyksXG4gIH0sXG59XG4vKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG5jb25zdCBlcnJvcnMgPSB7XG4gIEV4cG9ydE5hbWVkRGVjbGFyYXRpb246ICdNdWx0aXBsZSBuYW1lZCBleHBvcnQgZGVjbGFyYXRpb25zOyBjb25zb2xpZGF0ZSBhbGwgbmFtZWQgZXhwb3J0cyBpbnRvIGEgc2luZ2xlIGV4cG9ydCBkZWNsYXJhdGlvbicsXG4gIEFzc2lnbm1lbnRFeHByZXNzaW9uOiAnTXVsdGlwbGUgQ29tbW9uSlMgZXhwb3J0czsgY29uc29saWRhdGUgYWxsIGV4cG9ydHMgaW50byBhIHNpbmdsZSBhc3NpZ25tZW50IHRvIGBtb2R1bGUuZXhwb3J0c2AnLFxufVxuLyogZXNsaW50LWVuYWJsZSBtYXgtbGVuICovXG5cbi8qKlxuICogUmV0dXJucyBhbiBhcnJheSB3aXRoIG5hbWVzIG9mIHRoZSBwcm9wZXJ0aWVzIGluIHRoZSBhY2Nlc3NvciBjaGFpbiBmb3IgTWVtYmVyRXhwcmVzc2lvbiBub2Rlc1xuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYG1vZHVsZS5leHBvcnRzID0ge31gID0+IFsnbW9kdWxlJywgJ2V4cG9ydHMnXVxuICogYG1vZHVsZS5leHBvcnRzLnByb3BlcnR5ID0gdHJ1ZWAgPT4gWydtb2R1bGUnLCAnZXhwb3J0cycsICdwcm9wZXJ0eSddXG4gKlxuICogQHBhcmFtICAgICB7Tm9kZX0gICAgbm9kZSAgICBBU1QgTm9kZSAoTWVtYmVyRXhwcmVzc2lvbilcbiAqIEByZXR1cm4gICAge0FycmF5fSAgICAgICAgICAgQXJyYXkgd2l0aCB0aGUgcHJvcGVydHkgbmFtZXMgaW4gdGhlIGNoYWluXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBhY2Nlc3NvckNoYWluKG5vZGUpIHtcbiAgY29uc3QgY2hhaW4gPSBbXVxuXG4gIGRvIHtcbiAgICBjaGFpbi51bnNoaWZ0KG5vZGUucHJvcGVydHkubmFtZSlcblxuICAgIGlmIChub2RlLm9iamVjdC50eXBlID09PSAnSWRlbnRpZmllcicpIHtcbiAgICAgIGNoYWluLnVuc2hpZnQobm9kZS5vYmplY3QubmFtZSlcbiAgICAgIGJyZWFrXG4gICAgfVxuXG4gICAgbm9kZSA9IG5vZGUub2JqZWN0XG4gIH0gd2hpbGUgKG5vZGUudHlwZSA9PT0gJ01lbWJlckV4cHJlc3Npb24nKVxuXG4gIHJldHVybiBjaGFpblxufVxuXG5mdW5jdGlvbiBjcmVhdGUoY29udGV4dCkge1xuICBjb25zdCBub2RlcyA9IHtcbiAgICBtb2R1bGVzOiB7XG4gICAgICBzZXQ6IG5ldyBTZXQoKSxcbiAgICAgIHNvdXJjZXM6IHt9LFxuICAgIH0sXG4gICAgdHlwZXM6IHtcbiAgICAgIHNldDogbmV3IFNldCgpLFxuICAgICAgc291cmNlczoge30sXG4gICAgfSxcbiAgICBjb21tb25qczoge1xuICAgICAgc2V0OiBuZXcgU2V0KCksXG4gICAgfSxcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgRXhwb3J0TmFtZWREZWNsYXJhdGlvbihub2RlKSB7XG4gICAgICBsZXQgdGFyZ2V0ID0gbm9kZS5leHBvcnRLaW5kID09PSAndHlwZScgPyBub2Rlcy50eXBlcyA6IG5vZGVzLm1vZHVsZXNcbiAgICAgIGlmICghbm9kZS5zb3VyY2UpIHtcbiAgICAgICAgdGFyZ2V0LnNldC5hZGQobm9kZSlcbiAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh0YXJnZXQuc291cmNlc1tub2RlLnNvdXJjZS52YWx1ZV0pKSB7XG4gICAgICAgIHRhcmdldC5zb3VyY2VzW25vZGUuc291cmNlLnZhbHVlXS5wdXNoKG5vZGUpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0YXJnZXQuc291cmNlc1tub2RlLnNvdXJjZS52YWx1ZV0gPSBbbm9kZV1cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgQXNzaWdubWVudEV4cHJlc3Npb24obm9kZSkge1xuICAgICAgaWYgKG5vZGUubGVmdC50eXBlICE9PSAnTWVtYmVyRXhwcmVzc2lvbicpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNoYWluID0gYWNjZXNzb3JDaGFpbihub2RlLmxlZnQpXG5cbiAgICAgIC8vIEFzc2lnbm1lbnRzIHRvIG1vZHVsZS5leHBvcnRzXG4gICAgICAvLyBEZWVwZXIgYXNzaWdubWVudHMgYXJlIGlnbm9yZWQgc2luY2UgdGhleSBqdXN0IG1vZGlmeSB3aGF0J3MgYWxyZWFkeSBiZWluZyBleHBvcnRlZFxuICAgICAgLy8gKGllLiBtb2R1bGUuZXhwb3J0cy5leHBvcnRlZC5wcm9wID0gdHJ1ZSBpcyBpZ25vcmVkKVxuICAgICAgaWYgKGNoYWluWzBdID09PSAnbW9kdWxlJyAmJiBjaGFpblsxXSA9PT0gJ2V4cG9ydHMnICYmIGNoYWluLmxlbmd0aCA8PSAzKSB7XG4gICAgICAgIG5vZGVzLmNvbW1vbmpzLnNldC5hZGQobm9kZSlcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIC8vIEFzc2lnbm1lbnRzIHRvIGV4cG9ydHMgKGV4cG9ydHMuKiA9ICopXG4gICAgICBpZiAoY2hhaW5bMF0gPT09ICdleHBvcnRzJyAmJiBjaGFpbi5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgbm9kZXMuY29tbW9uanMuc2V0LmFkZChub2RlKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgJ1Byb2dyYW06ZXhpdCc6IGZ1bmN0aW9uIG9uRXhpdCgpIHtcbiAgICAgIC8vIFJlcG9ydCBtdWx0aXBsZSBgZXhwb3J0YCBkZWNsYXJhdGlvbnMgKEVTMjAxNSBtb2R1bGVzKVxuICAgICAgaWYgKG5vZGVzLm1vZHVsZXMuc2V0LnNpemUgPiAxKSB7XG4gICAgICAgIG5vZGVzLm1vZHVsZXMuc2V0LmZvckVhY2gobm9kZSA9PiB7XG4gICAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6IGVycm9yc1tub2RlLnR5cGVdLFxuICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIC8vIFJlcG9ydCBtdWx0aXBsZSBgYWdncmVnYXRlZCBleHBvcnRzYCBmcm9tIHRoZSBzYW1lIG1vZHVsZSAoRVMyMDE1IG1vZHVsZXMpXG4gICAgICBmbGF0KHZhbHVlcyhub2Rlcy5tb2R1bGVzLnNvdXJjZXMpXG4gICAgICAgIC5maWx0ZXIobm9kZXNXaXRoU291cmNlID0+IEFycmF5LmlzQXJyYXkobm9kZXNXaXRoU291cmNlKSAmJiBub2Rlc1dpdGhTb3VyY2UubGVuZ3RoID4gMSkpXG4gICAgICAgIC5mb3JFYWNoKChub2RlKSA9PiB7XG4gICAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6IGVycm9yc1tub2RlLnR5cGVdLFxuICAgICAgICAgIH0pXG4gICAgICAgIH0pXG5cbiAgICAgIC8vIFJlcG9ydCBtdWx0aXBsZSBgZXhwb3J0IHR5cGVgIGRlY2xhcmF0aW9ucyAoRkxPVyBFUzIwMTUgbW9kdWxlcylcbiAgICAgIGlmIChub2Rlcy50eXBlcy5zZXQuc2l6ZSA+IDEpIHtcbiAgICAgICAgbm9kZXMudHlwZXMuc2V0LmZvckVhY2gobm9kZSA9PiB7XG4gICAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6IGVycm9yc1tub2RlLnR5cGVdLFxuICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIC8vIFJlcG9ydCBtdWx0aXBsZSBgYWdncmVnYXRlZCB0eXBlIGV4cG9ydHNgIGZyb20gdGhlIHNhbWUgbW9kdWxlIChGTE9XIEVTMjAxNSBtb2R1bGVzKVxuICAgICAgZmxhdCh2YWx1ZXMobm9kZXMudHlwZXMuc291cmNlcylcbiAgICAgICAgLmZpbHRlcihub2Rlc1dpdGhTb3VyY2UgPT4gQXJyYXkuaXNBcnJheShub2Rlc1dpdGhTb3VyY2UpICYmIG5vZGVzV2l0aFNvdXJjZS5sZW5ndGggPiAxKSlcbiAgICAgICAgLmZvckVhY2goKG5vZGUpID0+IHtcbiAgICAgICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgbWVzc2FnZTogZXJyb3JzW25vZGUudHlwZV0sXG4gICAgICAgICAgfSlcbiAgICAgICAgfSlcblxuICAgICAgLy8gUmVwb3J0IG11bHRpcGxlIGBtb2R1bGUuZXhwb3J0c2AgYXNzaWdubWVudHMgKENvbW1vbkpTKVxuICAgICAgaWYgKG5vZGVzLmNvbW1vbmpzLnNldC5zaXplID4gMSkge1xuICAgICAgICBub2Rlcy5jb21tb25qcy5zZXQuZm9yRWFjaChub2RlID0+IHtcbiAgICAgICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgbWVzc2FnZTogZXJyb3JzW25vZGUudHlwZV0sXG4gICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9LFxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtZXRhLFxuICBjcmVhdGUsXG59XG4iXX0=