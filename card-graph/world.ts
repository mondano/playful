
let realm = card()

function send(id, queuecard, msg) {
  console.log("ID:", id, "MSG:", msg);
  queuecard.get("queue").push([id, msg]);
}

// a particular run function -> the process function is another.
// we need to make these functions not global
// but rather as paths on a map-graph.
async function run(idcard, queuecard) {
  let queue = queuecard.get("queue");
  while (queue.length) {
    let [id, msg] = queue.shift();
    idcard = await idcard
    id = await id
    if (await generatorish(idcard.get(id))) {
      idcard.get(id).next(msg);
    }
  }
}

// make the generatorfunc an array of arrays
// or simply part of the relations
async function card(relations = []/*, generatorfunc, generatorcard*/) {
  let card = new Map(relations); // takes an array of arrays of key value pairs
  try {
    card
      .set("positions", new Map())
      .set("stylizers", new Map())
      .set("filterers", new Map())
      .set("renderer", new Map()) // used to render elements (can be more or less receptive to the map-graph nesting structure)
      .set("runners", new Map())
      .set("expressions", new Map())
      .set("queue", []);
      /*
    if (generatorish(generatorfunc) && generatorcard) {
      generatorfunc = await generatorfunc;
      generatorcard = await generatorcard;
      card.set("generator", generatorfunc(generatorcard));
      card.get("generator").next();
    }*/
  } catch (err) {
    console.log(err);
  }
  return card;
}

async function front(
  titles: any[], 
  impulses: any[], 
  questions: any[], 
  moves: any[], 
  arcs: any[] = [], 
  seeds: any[] = []
) {
  let front = await card([
    [["title"], [...titles]], 
    [["impulses"], [...impulses]],
    [["questions"], [...questions]], 
    [["moves"], [...moves]],
    [["arcs"], [...arcs]], 
    [["granary"], [...seeds]]
  ]);
  return front;
}


async function arc(titles, sequences, aims) {
  let front = card([[["titles"], [...titles]], [["sequences"], [...sequences]],
[["aims"], [...aims]]])
  return arc
}


async function* thread(map, ...paths) {
  map = await map;
  let initmap = await map;
  for await (const path of paths) {
    if (map instanceof Map) {
      if (!map.has(path)) {
        map.set(path, new Map());
      }
      map = map.get(path);
    } else {
      return console.log("map variable is not instanceof Map");
    }
  }
  yield initmap;
}

async function* nav(...paths) {
  let map = paths.shift();
  for await (const path of paths) {
    if (map instanceof Map) {
      if (!map.has(path)) {
        map.set(path, new Map());
      }
      map = map.get(path);
    } else {
      return console.log("var map is not instanceof Map");
    }
    yield map;
  }
}

/*
 ▄▄ • ▄▄▄ . ▐ ▄ ▄▄▄ .▄▄▄   ▄▄▄· ▄▄▄▄▄      ▄▄▄  
▐█ ▀ ▪▀▄.▀·•█▌▐█▀▄.▀·▀▄ █·▐█ ▀█ •██  ▪     ▀▄ █·
▄█ ▀█▄▐▀▀▪▄▐█▐▐▌▐▀▀▪▄▐▀▀▄ ▄█▀▀█  ▐█.▪ ▄█▀▄ ▐▀▀▄ 
▐█▄▪▐█▐█▄▄▌██▐█▌▐█▄▄▌▐█•█▌▐█ ▪▐▌ ▐█▌·▐█▌.▐▌▐█•█▌
·▀▀▀▀  ▀▀▀ ▀▀ █▪ ▀▀▀ .▀  ▀ ▀  ▀  ▀▀▀  ▀█▄▀▪.▀  ▀
*/

/**
 * Async generator function that takes an interpretor and an iterable,
 * processes the input elements through the interpretor,
 * and yields the results.
 *
 * @generator
 * @yields {Promise<*>} A promise that resolves to the output of the interpretor applied to the input.
 */
export async function* generator() {
  console.log("listening...");
  /** @type {function(*): Promise<*>} */
  let interpretor = yield;
  /** @type {Promise<AsyncIterable<*>|Iterable<*>>} */
  let iterable = yield;
  console.log(interpretor, iterable);
  interpretor = await interpretor;
  iterable = await iterable;
  console.log(interpretor, iterable);
  yield [interpretor, iterable];
  while (true) {
    console.log("interpreting...");
    for await (const inputs of iterable) {
      let output = interpretor(inputs);
      yield output;
    }
  }
}

/*
▄• ▄▌▄▄▄▄▄▪  ▄▄▌  ▪  ▄▄▄▄▄ ▄· ▄▌
█▪██▌•██  ██ ██•  ██ •██  ▐█▪██▌
█▌▐█▌ ▐█.▪▐█·██▪  ▐█· ▐█.▪▐█▌▐█▪
▐█▄█▌ ▐█▌·▐█▌▐█▌▐▌▐█▌ ▐█▌· ▐█▀·.
 ▀▀▀  ▀▀▀ ▀▀▀.▀▀▀ ▀▀▀ ▀▀▀   ▀ •
*/

async function generatorish(value) {
  value = await value;
  return (
    value &&
    typeof value.next === "function" &&
    typeof value.return === "function"
  );
}

// Iterable Combinators
async function* map(iterable, mapfn) {
  for (let item of iterable) {
    yield mapfn(item);
  }
}

function* filter(iterable, filterFunc) {
  for (const x of iterable) {
    if (filterFunc(x)) {
      yield x;
    }
  }
}

function* draw(n, iterable) {
  //draw n cards from from a deck
  for (let item of iterable) {
    if (n <= 0) return;
    n--;
    yield item;
  }
}

// this one's behavior is a bit different from the Array's reduce since it yields the accumulator on each item (because your original iterable may never end)
async function* reduce(reducer, acc, iterable) {
  for await (const item of iterable) {
    yield (acc = reducer(acc, item));
  }
}