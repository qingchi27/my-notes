import {
  parse
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
import "./chunk-2TMVQXRO.js";
import "./chunk-NNEVABEX.js";
import "./chunk-M64QGIJS.js";
import {
  selectSvgElement
} from "./chunk-PA4VPADQ.js";
import {
  configureSvgSize
} from "./chunk-SG5ZS4WG.js";
import {
  log
} from "./chunk-NQ2SA5JI.js";
import {
  __name
} from "./chunk-5B3NYMUT.js";
import "./chunk-RDJU5PLV.js";
import "./chunk-EQCVQC35.js";

// node_modules/.pnpm/mermaid@11.16.0/node_modules/mermaid/dist/chunks/mermaid.core/infoDiagram-FWYZ7A6U.mjs
var parser = {
  parse: __name(async (input) => {
    const ast = await parse("info", input);
    log.debug(ast);
  }, "parse")
};
var DEFAULT_INFO_DB = {
  version: "11.16.0" + (true ? "" : "-tiny")
};
var getVersion = __name(() => DEFAULT_INFO_DB.version, "getVersion");
var db = {
  getVersion
};
var draw = __name((text, id, version) => {
  log.debug("rendering info diagram\n" + text);
  const svg = selectSvgElement(id);
  configureSvgSize(svg, 100, 400, true);
  const group = svg.append("g");
  group.append("text").attr("x", 100).attr("y", 40).attr("class", "version").attr("font-size", 32).style("text-anchor", "middle").text(`v${version}`);
}, "draw");
var renderer = { draw };
var diagram = {
  parser,
  db,
  renderer
};
export {
  diagram
};
//# sourceMappingURL=infoDiagram-FWYZ7A6U-RTO5LEIA.js.map
