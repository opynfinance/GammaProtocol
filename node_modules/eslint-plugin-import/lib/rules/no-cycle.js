'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          * @fileOverview Ensures that no imported module imports the linted module.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          * @author Ben Mosher
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          */

var _ExportMap = require('../ExportMap');

var _ExportMap2 = _interopRequireDefault(_ExportMap);

var _importType = require('../core/importType');

var _moduleVisitor = require('eslint-module-utils/moduleVisitor');

var _moduleVisitor2 = _interopRequireDefault(_moduleVisitor);

var _docsUrl = require('../docsUrl');

var _docsUrl2 = _interopRequireDefault(_docsUrl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// todo: cache cycles / deep relationships for faster repeat evaluation
module.exports = {
  meta: {
    type: 'suggestion',
    docs: { url: (0, _docsUrl2.default)('no-cycle') },
    schema: [(0, _moduleVisitor.makeOptionsSchema)({
      maxDepth: {
        description: 'maximum dependency depth to traverse',
        type: 'integer',
        minimum: 1
      },
      ignoreExternal: {
        description: 'ignore external modules',
        type: 'boolean',
        default: false
      }
    })]
  },

  create: function (context) {
    const myPath = context.getFilename();
    if (myPath === '<text>') return {}; // can't cycle-check a non-file

    const options = context.options[0] || {};
    const maxDepth = options.maxDepth || Infinity;
    const ignoreModule = name => options.ignoreExternal ? (0, _importType.isExternalModule)(name) : false;

    function checkSourceValue(sourceNode, importer) {
      if (ignoreModule(sourceNode.value)) {
        return; // ignore external modules
      }

      const imported = _ExportMap2.default.get(sourceNode.value, context);

      if (importer.importKind === 'type') {
        return; // no Flow import resolution
      }

      if (imported == null) {
        return; // no-unresolved territory
      }

      if (imported.path === myPath) {
        return; // no-self-import territory
      }

      const untraversed = [{ mget: () => imported, route: [] }];
      const traversed = new Set();
      function detectCycle(_ref) {
        let mget = _ref.mget,
            route = _ref.route;

        const m = mget();
        if (m == null) return;
        if (traversed.has(m.path)) return;
        traversed.add(m.path);

        for (let _ref2 of m.imports) {
          var _ref3 = _slicedToArray(_ref2, 2);

          let path = _ref3[0];
          var _ref3$ = _ref3[1];
          let getter = _ref3$.getter;
          let source = _ref3$.source;

          if (path === myPath) return true;
          if (traversed.has(path)) continue;
          if (ignoreModule(source.value)) continue;
          if (route.length + 1 < maxDepth) {
            untraversed.push({
              mget: getter,
              route: route.concat(source)
            });
          }
        }
      }

      while (untraversed.length > 0) {
        const next = untraversed.shift(); // bfs!
        if (detectCycle(next)) {
          const message = next.route.length > 0 ? `Dependency cycle via ${routeString(next.route)}` : 'Dependency cycle detected.';
          context.report(importer, message);
          return;
        }
      }
    }

    return (0, _moduleVisitor2.default)(checkSourceValue, context.options[0]);
  }
};

function routeString(route) {
  return route.map(s => `${s.value}:${s.loc.start.line}`).join('=>');
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1jeWNsZS5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwibWV0YSIsInR5cGUiLCJkb2NzIiwidXJsIiwic2NoZW1hIiwibWF4RGVwdGgiLCJkZXNjcmlwdGlvbiIsIm1pbmltdW0iLCJpZ25vcmVFeHRlcm5hbCIsImRlZmF1bHQiLCJjcmVhdGUiLCJjb250ZXh0IiwibXlQYXRoIiwiZ2V0RmlsZW5hbWUiLCJvcHRpb25zIiwiSW5maW5pdHkiLCJpZ25vcmVNb2R1bGUiLCJuYW1lIiwiY2hlY2tTb3VyY2VWYWx1ZSIsInNvdXJjZU5vZGUiLCJpbXBvcnRlciIsInZhbHVlIiwiaW1wb3J0ZWQiLCJFeHBvcnRzIiwiZ2V0IiwiaW1wb3J0S2luZCIsInBhdGgiLCJ1bnRyYXZlcnNlZCIsIm1nZXQiLCJyb3V0ZSIsInRyYXZlcnNlZCIsIlNldCIsImRldGVjdEN5Y2xlIiwibSIsImhhcyIsImFkZCIsImltcG9ydHMiLCJnZXR0ZXIiLCJzb3VyY2UiLCJsZW5ndGgiLCJwdXNoIiwiY29uY2F0IiwibmV4dCIsInNoaWZ0IiwibWVzc2FnZSIsInJvdXRlU3RyaW5nIiwicmVwb3J0IiwibWFwIiwicyIsImxvYyIsInN0YXJ0IiwibGluZSIsImpvaW4iXSwibWFwcGluZ3MiOiI7O3lwQkFBQTs7Ozs7QUFLQTs7OztBQUNBOztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBO0FBQ0FBLE9BQU9DLE9BQVAsR0FBaUI7QUFDZkMsUUFBTTtBQUNKQyxVQUFNLFlBREY7QUFFSkMsVUFBTSxFQUFFQyxLQUFLLHVCQUFRLFVBQVIsQ0FBUCxFQUZGO0FBR0pDLFlBQVEsQ0FBQyxzQ0FBa0I7QUFDekJDLGdCQUFTO0FBQ1BDLHFCQUFhLHNDQUROO0FBRVBMLGNBQU0sU0FGQztBQUdQTSxpQkFBUztBQUhGLE9BRGdCO0FBTXpCQyxzQkFBZ0I7QUFDZEYscUJBQWEseUJBREM7QUFFZEwsY0FBTSxTQUZRO0FBR2RRLGlCQUFTO0FBSEs7QUFOUyxL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QUFyQixFQUE0QjtBQUMxQixTQUFPQSxNQUFNa0IsR0FBTixDQUFVQyxLQUFNLEdBQUVBLEVBQUUzQixLQUFNLElBQUcyQixFQUFFQyxHQUFGLENBQU1DLEtBQU4sQ0FBWUMsSUFBSyxFQUE5QyxFQUFpREMsSUFBakQsQ0FBc0QsSUFBdEQsQ0FBUDtBQUNEIiwiZmlsZSI6Im5vLWN5Y2xlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAZmlsZU92ZXJ2aWV3IEVuc3VyZXMgdGhhdCBubyBpbXBvcnRlZCBtb2R1bGUgaW1wb3J0cyB0aGUgbGludGVkIG1vZHVsZS5cbiAqIEBhdXRob3IgQmVuIE1vc2hlclxuICovXG5cbmltcG9ydCBFeHBvcnRzIGZyb20gJy4uL0V4cG9ydE1hcCdcbmltcG9ydCB7IGlzRXh0ZXJuYWxNb2R1bGUgfSBmcm9tICcuLi9jb3JlL2ltcG9ydFR5cGUnXG5pbXBvcnQgbW9kdWxlVmlzaXRvciwgeyBtYWtlT3B0aW9uc1NjaGVtYSB9IGZyb20gJ2VzbGludC1tb2R1bGUtdXRpbHMvbW9kdWxlVmlzaXRvcidcbmltcG9ydCBkb2NzVXJsIGZyb20gJy4uL2RvY3NVcmwnXG5cbi8vIHRvZG86IGNhY2hlIGN5Y2xlcyAvIGRlZXAgcmVsYXRpb25zaGlwcyBmb3IgZmFzdGVyIHJlcGVhdCBldmFsdWF0aW9uXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWV0YToge1xuICAgIHR5cGU6ICdzdWdnZXN0aW9uJyxcbiAgICBkb2NzOiB7IHVybDogZG9jc1VybCgnbm8tY3ljbGUnKSB9LFxuICAgIHNjaGVtYTogW21ha2VPcHRpb25zU2NoZW1hKHtcbiAgICAgIG1heERlcHRoOntcbiAgICAgICAgZGVzY3JpcHRpb246ICdtYXhpbXVtIGRlcGVuZGVuY3kgZGVwdGggdG8gdHJhdmVyc2UnLFxuICAgICAgICB0eXBlOiAnaW50ZWdlcicsXG4gICAgICAgIG1pbmltdW06IDEsXG4gICAgICB9LFxuICAgICAgaWdub3JlRXh0ZXJuYWw6IHtcbiAgICAgICAgZGVzY3JpcHRpb246ICdpZ25vcmUgZXh0ZXJuYWwgbW9kdWxlcycsXG4gICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICB9LFxuICAgIH0pXSxcbiAgfSxcblxuICBjcmVhdGU6IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gICAgY29uc3QgbXlQYXRoID0gY29udGV4dC5nZXRGaWxlbmFtZSgpXG4gICAgaWYgKG15UGF0aCA9PT0gJzx0ZXh0PicpIHJldHVybiB7fSAvLyBjYW4ndCBjeWNsZS1jaGVjayBhIG5vbi1maWxlXG5cbiAgICBjb25zdCBvcHRpb25zID0gY29udGV4dC5vcHRpb25zWzBdIHx8IHt9XG4gICAgY29uc3QgbWF4RGVwdGggPSBvcHRpb25zLm1heERlcHRoIHx8IEluZmluaXR5XG4gICAgY29uc3QgaWdub3JlTW9kdWxlID0gKG5hbWUpID0+IG9wdGlvbnMuaWdub3JlRXh0ZXJuYWwgPyBpc0V4dGVybmFsTW9kdWxlKG5hbWUpIDogZmFsc2VcblxuICAgIGZ1bmN0aW9uIGNoZWNrU291cmNlVmFsdWUoc291cmNlTm9kZSwgaW1wb3J0ZXIpIHtcbiAgICAgIGlmIChpZ25vcmVNb2R1bGUoc291cmNlTm9kZS52YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIC8vIGlnbm9yZSBleHRlcm5hbCBtb2R1bGVzXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGltcG9ydGVkID0gRXhwb3J0cy5nZXQoc291cmNlTm9kZS52YWx1ZSwgY29udGV4dClcblxuICAgICAgaWYgKGltcG9ydGVyLmltcG9ydEtpbmQgPT09ICd0eXBlJykge1xuICAgICAgICByZXR1cm4gLy8gbm8gRmxvdyBpbXBvcnQgcmVzb2x1dGlvblxuICAgICAgfVxuXG4gICAgICBpZiAoaW1wb3J0ZWQgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gIC8vIG5vLXVucmVzb2x2ZWQgdGVycml0b3J5XG4gICAgICB9XG5cbiAgICAgIGlmIChpbXBvcnRlZC5wYXRoID09PSBteVBhdGgpIHtcbiAgICAgICAgcmV0dXJuICAvLyBuby1zZWxmLWltcG9ydCB0ZXJyaXRvcnlcbiAgICAgIH1cblxuICAgICAgY29uc3QgdW50cmF2ZXJzZWQgPSBbe21nZXQ6ICgpID0+IGltcG9ydGVkLCByb3V0ZTpbXX1dXG4gICAgICBjb25zdCB0cmF2ZXJzZWQgPSBuZXcgU2V0KClcbiAgICAgIGZ1bmN0aW9uIGRldGVjdEN5Y2xlKHttZ2V0LCByb3V0ZX0pIHtcbiAgICAgICAgY29uc3QgbSA9IG1nZXQoKVxuICAgICAgICBpZiAobSA9PSBudWxsKSByZXR1cm5cbiAgICAgICAgaWYgKHRyYXZlcnNlZC5oYXMobS5wYXRoKSkgcmV0dXJuXG4gICAgICAgIHRyYXZlcnNlZC5hZGQobS5wYXRoKVxuXG4gICAgICAgIGZvciAobGV0IFtwYXRoLCB7IGdldHRlciwgc291cmNlIH1dIG9mIG0uaW1wb3J0cykge1xuICAgICAgICAgIGlmIChwYXRoID09PSBteVBhdGgpIHJldHVybiB0cnVlXG4gICAgICAgICAgaWYgKHRyYXZlcnNlZC5oYXMocGF0aCkpIGNvbnRpbnVlXG4gICAgICAgICAgaWYgKGlnbm9yZU1vZHVsZShzb3VyY2UudmFsdWUpKSBjb250aW51ZVxuICAgICAgICAgIGlmIChyb3V0ZS5sZW5ndGggKyAxIDwgbWF4RGVwdGgpIHtcbiAgICAgICAgICAgIHVudHJhdmVyc2VkLnB1c2goe1xuICAgICAgICAgICAgICBtZ2V0OiBnZXR0ZXIsXG4gICAgICAgICAgICAgIHJvdXRlOiByb3V0ZS5jb25jYXQoc291cmNlKSxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHdoaWxlICh1bnRyYXZlcnNlZC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IG5leHQgPSB1bnRyYXZlcnNlZC5zaGlmdCgpIC8vIGJmcyFcbiAgICAgICAgaWYgKGRldGVjdEN5Y2xlKG5leHQpKSB7XG4gICAgICAgICAgY29uc3QgbWVzc2FnZSA9IChuZXh0LnJvdXRlLmxlbmd0aCA+IDBcbiAgICAgICAgICAgID8gYERlcGVuZGVuY3kgY3ljbGUgdmlhICR7cm91dGVTdHJpbmcobmV4dC5yb3V0ZSl9YFxuICAgICAgICAgICAgOiAnRGVwZW5kZW5jeSBjeWNsZSBkZXRlY3RlZC4nKVxuICAgICAgICAgIGNvbnRleHQucmVwb3J0KGltcG9ydGVyLCBtZXNzYWdlKVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG1vZHVsZVZpc2l0b3IoY2hlY2tTb3VyY2VWYWx1ZSwgY29udGV4dC5vcHRpb25zWzBdKVxuICB9LFxufVxuXG5mdW5jdGlvbiByb3V0ZVN0cmluZyhyb3V0ZSkge1xuICByZXR1cm4gcm91dGUubWFwKHMgPT4gYCR7cy52YWx1ZX06JHtzLmxvYy5zdGFydC5saW5lfWApLmpvaW4oJz0+Jylcbn1cbiJdfQ==