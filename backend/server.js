const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const USER = {
  user_id: "amarnathreddy_2005",
  email_id: "ad3674@srmist..edu",
  college_roll_number: "RA2311026010184"
};

const isValid = (str) => {
  str = str.trim();
  if (!/^[A-Z]->[A-Z]$/.test(str)) return false;
  const [p, c] = str.split("->");
  if (p === c) return false;
  return true;
};

app.post("/bfhl", (req, res) => {
  let { data } = req.body;

  let invalid = [];
  let duplicates = [];
  let seen = new Set();
  let edges = [];

  data.forEach(raw => {
    let str = raw.trim();

    if (!isValid(str)) {
      invalid.push(raw);
      return;
    }

    if (seen.has(str)) {
      if (!duplicates.includes(str)) duplicates.push(str);
      return;
    }

    seen.add(str);
    edges.push(str);
  });

  let graph = {};
  let parent = {};
  let nodes = new Set();

  edges.forEach(e => {
    let [u, v] = e.split("->");

    if (!graph[u]) graph[u] = [];
    graph[u].push(v);

    if (!(v in parent)) parent[v] = u;

    nodes.add(u);
    nodes.add(v);
  });

  const hasCycle = (node, visited, stack) => {
    if (stack.has(node)) return true;
    if (visited.has(node)) return false;

    visited.add(node);
    stack.add(node);

    for (let nei of (graph[node] || [])) {
      if (hasCycle(nei, visited, stack)) return true;
    }

    stack.delete(node);
    return false;
  };

  const buildTree = (node) => {
    let obj = {};
    for (let child of (graph[node] || [])) {
      obj[child] = buildTree(child);
    }
    return obj;
  };

  const getDepth = (node) => {
    if (!graph[node] || graph[node].length === 0) return 1;
    return 1 + Math.max(...graph[node].map(getDepth));
  };

  let hierarchies = [];
  let total_trees = 0;
  let total_cycles = 0;
  let maxDepth = 0;
  let largestRoot = "";

  let visitedGlobal = new Set();

  nodes.forEach(node => {
    if (visitedGlobal.has(node)) return;

    let visited = new Set();
    let stack = new Set();

    let cycle = hasCycle(node, visited, stack);

    visited.forEach(n => visitedGlobal.add(n));

    if (cycle) {
      total_cycles++;
      hierarchies.push({
        root: node,
        tree: {},
        has_cycle: true
      });
    } else {
      total_trees++;
      let tree = {};
      tree[node] = buildTree(node);

      let depth = getDepth(node);

      if (depth > maxDepth || 
         (depth === maxDepth && node < largestRoot)) {
        maxDepth = depth;
        largestRoot = node;
      }

      hierarchies.push({
        root: node,
        tree,
        depth
      });
    }
  });

  res.json({
    ...USER,
    hierarchies,
    invalid_entries: invalid,
    duplicate_edges: duplicates,
    summary: {
      total_trees,
      total_cycles,
      largest_tree_root: largestRoot
    }
  });
});

app.listen(3000, () => console.log("Server running on port 3000"));