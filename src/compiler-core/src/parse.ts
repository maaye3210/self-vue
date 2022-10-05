import { NodeTypes } from "./ast";

const enum TagType {
  Start,
  End,
}

const context = createParserContext('');

export function baseParse(content: string) {
  context.source = content
  return createRoot(parseChildren());
}

function getNextState(content: string) {
  if (content.startsWith('{{')) {
    return NodeTypes.INTERPOLATION
  }
  if (/^<[a-z]*>/i.test(content)) {
    return NodeTypes.ELEMENT
  }
  return NodeTypes.TEXT
}

const stateHandle = new Map([
  [NodeTypes.TEXT, parseText],
  [NodeTypes.ELEMENT, parseElement],
  [NodeTypes.INTERPOLATION, parseInterpolation],
])

function parseChildren() {
  const nodes: any = [];

  while (!isEnd()) {
    const currentHandle = stateHandle.get(getNextState(context.source)) as Function
    const node = currentHandle()
    nodes.push(node);
  }
  return nodes;
}

function isEnd() {
  const s = context.source;
  const ancestors = context.ancestors
  if (s.startsWith("</")) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const tag = ancestors[i].tag;
      if (startsWithEndTagOpen(tag)) {
        return true;
      }
    }
  }
  return !s;
}

function parseText() {
  let endIndex = context.source.length;
  let endTokens = ["<", "{{"];

  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i]);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }

  const content = parseTextData(endIndex);

  return {
    type: NodeTypes.TEXT,
    content,
  };
}

function parseTextData(length) {
  const content = context.source.slice(0, length);

  advanceBy(length);
  return content;
}

function parseElement() {
  const element: any = parseTag(TagType.Start);
  context.ancestors.push(element)
  element.children = parseChildren();
  context.ancestors.pop();
  if (startsWithEndTagOpen(element.tag)) {
    parseTag(TagType.End);
  } else {
    throw new Error(`缺少结束标签:${element.tag}`);
  }

  return element;
}

function startsWithEndTagOpen(tag) {
  return (
    context.source.startsWith("</") &&
    context.source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
  );
}

function parseTag(type: TagType) {
  const match: any = /^<\/?([a-z]*)>/i.exec(context.source);
  const tag = match[1];
  advanceBy(match[0].length);

  if (type === TagType.End) return;

  return {
    type: NodeTypes.ELEMENT,
    tag,
  };
}

function parseInterpolation() {
  // {{message}}
  const openDelimiter = "{{";
  const closeDelimiter = "}}";

  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length
  );

  advanceBy(openDelimiter.length);

  const rawContentLength = closeIndex - openDelimiter.length;

  const rawContent = parseTextData(rawContentLength);

  const content = rawContent.trim();

  advanceBy(closeDelimiter.length);

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content,
    },
  };
}

function advanceBy(length: number) {
  context.source = context.source.slice(length);
}

function createRoot(children) {
  return {
    children,
  };
}

function createParserContext(content: string): any {
  return {
    source: content,
    ancestors: []
  };
}
