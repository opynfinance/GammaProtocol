'use strict';

var _vm = require('vm');

var _vm2 = _interopRequireDefault(_vm);

var _docsUrl = require('../docsUrl');

var _docsUrl2 = _interopRequireDefault(_docsUrl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('dynamic-import-chunkname')
    },
    schema: [{
      type: 'object',
      properties: {
        importFunctions: {
          type: 'array',
          uniqueItems: true,
          items: {
            type: 'string'
          }
        },
        webpackChunknameFormat: {
          type: 'string'
        }
      }
    }]
  },

  create: function (context) {
    const config = context.options[0];

    var _ref = config || {},
        _ref$importFunctions = _ref.importFunctions;

    const importFunctions = _ref$importFunctions === undefined ? [] : _ref$importFunctions;

    var _ref2 = config || {},
        _ref2$webpackChunknam = _ref2.webpackChunknameFormat;

    const webpackChunknameFormat = _ref2$webpackChunknam === undefined ? '[0-9a-zA-Z-_/.]+' : _ref2$webpackChunknam;


    const paddedCommentRegex = /^ (\S[\s\S]+\S) $/;
    const commentStyleRegex = /^( \w+: ("[^"]*"|\d+|false|true),?)+ $/;
    const chunkSubstrFormat = ` webpackChunkName: "${webpackChunknameFormat}",? `;
    const chunkSubstrRegex = new RegExp(chunkSubstrFormat);

    return {
      CallExpression(node) {
        if (node.callee.type !== 'Import' && importFunctions.indexOf(node.callee.name) < 0) {
          return;
        }

        const sourceCode = context.getSourceCode();
        const arg = node.arguments[0];
        const leadingComments = sourceCode.getCommentsBefore ? sourceCode.getCommentsBefore(arg) // This method is available in ESLint >= 4.
        : sourceCode.getComments(arg).leading; // This method is deprecated in ESLint 7.

        if (!leadingComments || leadingComments.length === 0) {
          context.report({
            node,
            message: 'dynamic imports require a leading comment with the webpack chunkname'
          });
          return;
        }

        let isChunknamePresent = false;

        for (const comment of leadingComments) {
          if (comment.type !== 'Block') {
            context.report({
              node,
              message: 'dynamic imports require a /* foo */ style comment, not a // foo comment'
            });
            return;
          }

          if (!paddedCommentRegex.test(comment.value)) {
            context.report({
              node,
              message: `dynamic imports require a block comment padded with spaces - /* foo */`
            });
            return;
          }

          try {
            // just like webpack itself does
            _vm2.default.runInNewContext(`(function(){return {${comment.value}}})()`);
          } catch (error) {
            context.report({
              node,
              message: `dynamic imports require a "webpack" comment with valid syntax`
            });
            return;
          }

          if (!commentStyleRegex.test(comment.value)) {
            context.report({
              node,
              message: `dynamic imports require a leading comment in the form /*${chunkSubstrFormat}*/`
            });
            return;
          }

          if (chunkSubstrRegex.test(comment.value)) {
            isChunknamePresent = true;
          }
        }

        if (!isChunknamePresent) {
          context.report({
            node,
            message: `dynamic imports require a leading comment in the form /*${chunkSubstrFormat}*/`
          });
        }
      }
    };
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9keW5hbWljLWltcG9ydC1jaHVua25hbWUuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsIm1ldGEiLCJ0eXBlIiwiZG9jcyIsInVybCIsInNjaGVtYSIsInByb3BlcnRpZXMiLCJpbXBvcnRGdW5jdGlvbnMiLCJ1bmlxdWVJdGVtcyIsIml0ZW1zIiwid2VicGFja0NodW5rbmFtZUZvcm1hdCIsImNyZWF0ZSIsImNvbnRleHQiLCJjb25maWciLCJvcHRpb25zIiwicGFkZGVkQ29tbWVudFJlZ2V4IiwiY29tbWVudFN0eWxlUmVnZXgiLCJjaHVua1N1YnN0ckZvcm1hdCIsImNodW5rU3Vic3RyUmVnZXgiLCJSZWdFeHAiLCJDYWxsRXhwcmVzc2lvbiIsIm5vZGUiLCJjYWxsZWUiLCJpbmRleE9mIiwibmFtZSIsInNvdXJjZUNvZGUiLCJnZXRTb3VyY2VDb2RlIiwiYXJnIiwiYXJndW1lbnRzIiwibGVhZGluZ0NvbW1lbnRzIiwiZ2V0Q29tbWVudHNCZWZvcmUiLCJnZXRDb21tZW50cyIsImxlYWRpbmciLCJsZW5ndGgiLCJyZXBvcnQiLCJtZXNzYWdlIiwiaXNDaHVua25hbWVQcmVzZW50IiwiY29tbWVudCIsInRlc3QiLCJ2YWx1ZSIsInZtIiwicnVuSW5OZXdDb250ZXh0IiwiZXJyb3IiXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7QUFDQTs7Ozs7O0FBRUFBLE9BQU9DLE9BQVAsR0FBaUI7QUFDZkMsUUFBTTtBQUNKQyxVQUFNLFlBREY7QUFFSkMsVUFBTTtBQUNKQyxXQUFLLHVCQUFRLDBCQUFSO0FBREQsS0FGRjtBQUtKQyxZQUFRLENBQUM7QUFDUEgsWUFBTSxRQURDO0FBRVBJLGtCQUFZO0FBQ1ZDLHlCQUFpQjtBQUNmTCxnQkFBTSxPQURTO0FBRWZNLHVCQUFhLElBRkU7QUFHZkMsaUJBQU87QUFDTFAsa0JBQU07QUFERDtBQUhRLFNBRFA7QUFRVlEsZ0NBQXdCO0FBQ3RCUixnQkFBTTtBQURnQjtBQVJkO0FB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dCI6WyJpbXBvcnQgdm0gZnJvbSAndm0nXG5pbXBvcnQgZG9jc1VybCBmcm9tICcuLi9kb2NzVXJsJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWV0YToge1xuICAgIHR5cGU6ICdzdWdnZXN0aW9uJyxcbiAgICBkb2NzOiB7XG4gICAgICB1cmw6IGRvY3NVcmwoJ2R5bmFtaWMtaW1wb3J0LWNodW5rbmFtZScpLFxuICAgIH0sXG4gICAgc2NoZW1hOiBbe1xuICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIGltcG9ydEZ1bmN0aW9uczoge1xuICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgdW5pcXVlSXRlbXM6IHRydWUsXG4gICAgICAgICAgaXRlbXM6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHdlYnBhY2tDaHVua25hbWVGb3JtYXQ6IHtcbiAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfV0sXG4gIH0sXG5cbiAgY3JlYXRlOiBmdW5jdGlvbiAoY29udGV4dCkge1xuICAgIGNvbnN0IGNvbmZpZyA9IGNvbnRleHQub3B0aW9uc1swXVxuICAgIGNvbnN0IHsgaW1wb3J0RnVuY3Rpb25zID0gW10gfSA9IGNvbmZpZyB8fCB7fVxuICAgIGNvbnN0IHsgd2VicGFja0NodW5rbmFtZUZvcm1hdCA9ICdbMC05YS16QS1aLV8vLl0rJyB9ID0gY29uZmlnIHx8IHt9XG5cbiAgICBjb25zdCBwYWRkZWRDb21tZW50UmVnZXggPSAvXiAoXFxTW1xcc1xcU10rXFxTKSAkL1xuICAgIGNvbnN0IGNvbW1lbnRTdHlsZVJlZ2V4ID0gL14oIFxcdys6IChcIlteXCJdKlwifFxcZCt8ZmFsc2V8dHJ1ZSksPykrICQvXG4gICAgY29uc3QgY2h1bmtTdWJzdHJGb3JtYXQgPSBgIHdlYnBhY2tDaHVua05hbWU6IFwiJHt3ZWJwYWNrQ2h1bmtuYW1lRm9ybWF0fVwiLD8gYFxuICAgIGNvbnN0IGNodW5rU3Vic3RyUmVnZXggPSBuZXcgUmVnRXhwKGNodW5rU3Vic3RyRm9ybWF0KVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIENhbGxFeHByZXNzaW9uKG5vZGUpIHtcbiAgICAgICAgaWYgKG5vZGUuY2FsbGVlLnR5cGUgIT09ICdJbXBvcnQnICYmIGltcG9ydEZ1bmN0aW9ucy5pbmRleE9mKG5vZGUuY2FsbGVlLm5hbWUpIDwgMCkge1xuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc291cmNlQ29kZSA9IGNvbnRleHQuZ2V0U291cmNlQ29kZSgpXG4gICAgICAgIGNvbnN0IGFyZyA9IG5vZGUuYXJndW1lbnRzWzBdXG4gICAgICAgIGNvbnN0IGxlYWRpbmdDb21tZW50cyA9IHNvdXJjZUNvZGUuZ2V0Q29tbWVudHNCZWZvcmVcbiAgICAgICAgICA/IHNvdXJjZUNvZGUuZ2V0Q29tbWVudHNCZWZvcmUoYXJnKSAvLyBUaGlzIG1ldGhvZCBpcyBhdmFpbGFibGUgaW4gRVNMaW50ID49IDQuXG4gICAgICAgICAgOiBzb3VyY2VDb2RlLmdldENvbW1lbnRzKGFyZykubGVhZGluZyAvLyBUaGlzIG1ldGhvZCBpcyBkZXByZWNhdGVkIGluIEVTTGludCA3LlxuXG4gICAgICAgIGlmICghbGVhZGluZ0NvbW1lbnRzIHx8IGxlYWRpbmdDb21tZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgbWVzc2FnZTogJ2R5bmFtaWMgaW1wb3J0cyByZXF1aXJlIGEgbGVhZGluZyBjb21tZW50IHdpdGggdGhlIHdlYnBhY2sgY2h1bmtuYW1lJyxcbiAgICAgICAgICB9KVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGlzQ2h1bmtuYW1lUHJlc2VudCA9IGZhbHNlXG5cbiAgICAgICAgZm9yIChjb25zdCBjb21tZW50IG9mIGxlYWRpbmdDb21tZW50cykge1xuICAgICAgICAgIGlmIChjb21tZW50LnR5cGUgIT09ICdCbG9jaycpIHtcbiAgICAgICAgICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgICAgbWVzc2FnZTogJ2R5bmFtaWMgaW1wb3J0cyByZXF1aXJlIGEgLyogZm9vICovIHN0eWxlIGNvbW1lbnQsIG5vdCBhIC8vIGZvbyBjb21tZW50JyxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIXBhZGRlZENvbW1lbnRSZWdleC50ZXN0KGNvbW1lbnQudmFsdWUpKSB7XG4gICAgICAgICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGBkeW5hbWljIGltcG9ydHMgcmVxdWlyZSBhIGJsb2NrIGNvbW1lbnQgcGFkZGVkIHdpdGggc3BhY2VzIC0gLyogZm9vICovYCxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8ganVzdCBsaWtlIHdlYnBhY2sgaXRzZWxmIGRvZXNcbiAgICAgICAgICAgIHZtLnJ1bkluTmV3Q29udGV4dChgKGZ1bmN0aW9uKCl7cmV0dXJuIHske2NvbW1lbnQudmFsdWV9fX0pKClgKVxuICAgICAgICAgIH1cbiAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgICAgbWVzc2FnZTogYGR5bmFtaWMgaW1wb3J0cyByZXF1aXJlIGEgXCJ3ZWJwYWNrXCIgY29tbWVudCB3aXRoIHZhbGlkIHN5bnRheGAsXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFjb21tZW50U3R5bGVSZWdleC50ZXN0KGNvbW1lbnQudmFsdWUpKSB7XG4gICAgICAgICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICAgIG1lc3NhZ2U6XG4gICAgICAgICAgICAgICAgYGR5bmFtaWMgaW1wb3J0cyByZXF1aXJlIGEgbGVhZGluZyBjb21tZW50IGluIHRoZSBmb3JtIC8qJHtjaHVua1N1YnN0ckZvcm1hdH0qL2AsXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGNodW5rU3Vic3RyUmVnZXgudGVzdChjb21tZW50LnZhbHVlKSkge1xuICAgICAgICAgICAgaXNDaHVua25hbWVQcmVzZW50ID0gdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaXNDaHVua25hbWVQcmVzZW50KSB7XG4gICAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6XG4gICAgICAgICAgICAgIGBkeW5hbWljIGltcG9ydHMgcmVxdWlyZSBhIGxlYWRpbmcgY29tbWVudCBpbiB0aGUgZm9ybSAvKiR7Y2h1bmtTdWJzdHJGb3JtYXR9Ki9gLFxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfVxuICB9LFxufVxuIl19