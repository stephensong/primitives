

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _helperPluginUtils = require("@babel/helper-plugin-utils");

var _helperAnnotateAsPure = _interopRequireDefault(require("@babel/helper-annotate-as-pure"));

var _core = require("@babel/core");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const PURE_CALLS = new Map([['@radix-ui/react-polymorphic', ['forwardRefWithAs']]]);

var _default = (0, _helperPluginUtils.declare)(api => {
  api.assertVersion(7);
  return {
    visitor: {
      ExpressionStatement(path) {
        if (_core.types.isAssignmentExpression(path.node.expression) && _core.types.isIdentifier(path.node.expression.left.property, {
          name: 'displayName'
        })) {
          const displayNameStatement = path.node;

          const NODE_ENV = _core.types.memberExpression(_core.types.memberExpression(_core.types.identifier('process'), _core.types.identifier('env')), _core.types.identifier('NODE_ENV'));

          const check = _core.types.ifStatement(_core.types.binaryExpression('!==', NODE_ENV, _core.types.stringLiteral('production')), _core.types.blockStatement([displayNameStatement]));

          path.replaceWith(check);
          path.skip();
        }
      },

      CallExpression(path) {
        if (isImported(path)) {
          (0, _helperAnnotateAsPure.default)(path);
        }
      }

    }
  };
});

exports.default = _default;

function isImported(path) {
  if (!_core.types.isMemberExpression(path.node.callee)) {
    const callee = path.get('callee');

    for (const [module, methods] of PURE_CALLS) {
      for (const method of methods) {
        if (callee.referencesImport(module, method)) {
          return true;
        }
      }
    }

    return false;
  }

  return false;
}


////////////////////////////////////////////////////////////////////////////////////////////////////
// Untranspiled source
////////////////////////////////////////////////////////////////////////////////////////////////////


// import { declare } from '@babel/helper-plugin-utils';
// import annotateAsPure from '@babel/helper-annotate-as-pure';
// import { types } from '@babel/core';

// const PURE_CALLS = new Map([['@radix-ui/react-polymorphic', ['forwardRefWithAs']]]);

// export default declare((api) => {
//   api.assertVersion(7);

//   return {
//     name: 'transform-react-pure-annotations',
//     visitor: {
//       ExpressionStatement(path) {
//         if (
//           types.isAssignmentExpression(path.node.expression) &&
//           types.isIdentifier(path.node.expression.left.property, { name: 'displayName' })
//         ) {
//           const displayNameStatement = path.node;
//           const NODE_ENV = types.memberExpression(
//             types.memberExpression(types.identifier('process'), types.identifier('env')),
//             types.identifier('NODE_ENV')
//           );
//           const check = types.ifStatement(
//             types.binaryExpression('!==', NODE_ENV, types.stringLiteral('production')),
//             types.blockStatement([displayNameStatement])
//           );
//           path.replaceWith(check);
//           path.skip();
//         }
//       },
//       CallExpression(path) {
//         if (isImported(path)) {
//           annotateAsPure(path);
//         }
//       },
//     },
//   };
// });

// function isImported(path) {
//   if (!types.isMemberExpression(path.node.callee)) {
//     const callee = path.get('callee');
//     for (const [module, methods] of PURE_CALLS) {
//       for (const method of methods) {
//         if (callee.referencesImport(module, method)) {
//           return true;
//         }
//       }
//     }

//     return false;
//   }

//   return false;
// }
