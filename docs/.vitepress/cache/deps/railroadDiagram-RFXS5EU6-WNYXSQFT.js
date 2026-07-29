import {
  db,
  getStyles,
  renderer
} from "./chunk-EK5L7HMR.js";
import {
  populateCommonDb
} from "./chunk-CUQXYUB6.js";
import {
  MermaidParseError
} from "./chunk-TD5UVD3M.js";
import "./chunk-SXIHIYR3.js";
import "./chunk-UKEWA3LP.js";
import "./chunk-XELTIVUN.js";
import "./chunk-AUVHO7QM.js";
import "./chunk-MURM5U3E.js";
import "./chunk-V5VFUYCI.js";
import "./chunk-PTOOQICB.js";
import "./chunk-FCVFPELR.js";
import "./chunk-46HUCZPF.js";
import "./chunk-IZQLKYKD.js";
import "./chunk-UZYGQ7A7.js";
import "./chunk-HCYQ3Z3L.js";
import "./chunk-LM3QKBN5.js";
import {
  createRailroadServices
} from "./chunk-2TMVQXRO.js";
import "./chunk-NNEVABEX.js";
import "./chunk-M64QGIJS.js";
import "./chunk-PA4VPADQ.js";
import "./chunk-SG5ZS4WG.js";
import {
  log
} from "./chunk-NQ2SA5JI.js";
import {
  __name
} from "./chunk-5B3NYMUT.js";
import "./chunk-RDJU5PLV.js";
import "./chunk-EQCVQC35.js";

// node_modules/.pnpm/mermaid@11.16.0/node_modules/mermaid/dist/chunks/mermaid.core/railroadDiagram-RFXS5EU6.mjs
var langiumParser = createRailroadServices().Railroad.parser.LangiumParser;
var transformExpression = __name((expr) => {
  switch (expr.$type) {
    case "RailroadTerminalExpr":
      return {
        type: "terminal",
        value: expr.value
      };
    case "RailroadNonTerminalExpr":
      return {
        type: "nonterminal",
        name: expr.name
      };
    case "RailroadSpecialExpr":
      return {
        type: "special",
        text: expr.text
      };
    case "RailroadSequenceExpr": {
      const elements = expr.elements.map(transformExpression);
      return elements.length === 1 ? elements[0] : { type: "sequence", elements };
    }
    case "RailroadChoiceExpr": {
      const alternatives = expr.alternatives.map(transformExpression);
      return alternatives.length === 1 ? alternatives[0] : { type: "choice", alternatives };
    }
    case "RailroadOptionalExpr":
      return {
        type: "optional",
        element: transformExpression(expr.element)
      };
    case "RailroadOneOrMoreExpr":
      return {
        type: "repetition",
        element: transformExpression(expr.element),
        min: 1,
        max: Infinity
      };
    case "RailroadZeroOrMoreExpr":
      return {
        type: "repetition",
        element: transformExpression(expr.element),
        min: 0,
        max: Infinity
      };
    default:
      throw new Error(`Unsupported railroad expression: ${expr.$type}`);
  }
}, "transformExpression");
var transformRule = __name((rule) => {
  return {
    name: rule.name,
    definition: transformExpression(rule.definition)
  };
}, "transformRule");
var populateDb = __name((ast) => {
  populateCommonDb(ast, db);
  if (ast.title) {
    db.setTitle(ast.title);
  }
  ast.rules.map((rule) => db.addRule(transformRule(rule)));
}, "populateDb");
var parser = {
  parse: __name((input) => {
    db.clear();
    log.debug("[Railroad Parser] Starting Langium parse");
    const result = langiumParser.parse(input);
    if (result.lexerErrors.length > 0 || result.parserErrors.length > 0) {
      throw new MermaidParseError(result);
    }
    const ast = result.value;
    log.debug("[Railroad Parser] Parsed rules:", ast.rules.length);
    populateDb(ast);
    log.debug("[Railroad Parser] Parse complete");
  }, "parse"),
  parser: {
    yy: db
  }
};
var diagram = {
  parser,
  db,
  renderer,
  styles: getStyles
};
var railroadDiagram_default = diagram;
export {
  railroadDiagram_default as default,
  diagram
};
//# sourceMappingURL=railroadDiagram-RFXS5EU6-WNYXSQFT.js.map
