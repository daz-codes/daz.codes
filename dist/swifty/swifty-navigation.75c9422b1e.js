// node_modules/idiomorph/dist/idiomorph.esm.js
var Idiomorph = (function() {
  "use strict";
  const noOp = () => {
  };
  const defaults = {
    morphStyle: "outerHTML",
    callbacks: {
      beforeNodeAdded: noOp,
      afterNodeAdded: noOp,
      beforeNodeMorphed: noOp,
      afterNodeMorphed: noOp,
      beforeNodeRemoved: noOp,
      afterNodeRemoved: noOp,
      beforeAttributeUpdated: noOp
    },
    head: {
      style: "merge",
      shouldPreserve: (elt) => elt.getAttribute("im-preserve") === "true",
      shouldReAppend: (elt) => elt.getAttribute("im-re-append") === "true",
      shouldRemove: noOp,
      afterHeadMorphed: noOp
    },
    restoreFocus: true
  };
  function morph(oldNode, newContent, config = {}) {
    oldNode = normalizeElement(oldNode);
    const newNode = normalizeParent(newContent);
    const ctx = createMorphContext(oldNode, newNode, config);
    const morphedNodes = saveAndRestoreFocus(ctx, () => {
      return withHeadBlocking(
        ctx,
        oldNode,
        newNode,
        /** @param {MorphContext} ctx */
        (ctx2) => {
          if (ctx2.morphStyle === "innerHTML") {
            morphChildren(ctx2, oldNode, newNode);
            return Array.from(oldNode.childNodes);
          } else {
            return morphOuterHTML(ctx2, oldNode, newNode);
          }
        }
      );
    });
    ctx.pantry.remove();
    return morphedNodes;
  }
  function morphOuterHTML(ctx, oldNode, newNode) {
    const oldParent = normalizeParent(oldNode);
    morphChildren(
      ctx,
      oldParent,
      newNode,
      // these two optional params are the secret sauce
      oldNode,
      // start point for iteration
      oldNode.nextSibling
      // end point for iteration
    );
    return Array.from(oldParent.childNodes);
  }
  function saveAndRestoreFocus(ctx, fn) {
    if (!ctx.config.restoreFocus) return fn();
    let activeElement = (
      /** @type {HTMLInputElement|HTMLTextAreaElement|null} */
      document.activeElement
    );
    if (!(activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement)) {
      return fn();
    }
    const { id: activeElementId, selectionStart, selectionEnd } = activeElement;
    const results = fn();
    if (activeElementId && activeElementId !== document.activeElement?.getAttribute("id")) {
      activeElement = ctx.target.querySelector(`[id="${activeElementId}"]`);
      activeElement?.focus();
    }
    if (activeElement && !activeElement.selectionEnd && selectionEnd) {
      activeElement.setSelectionRange(selectionStart, selectionEnd);
    }
    return results;
  }
  const morphChildren = /* @__PURE__ */ (function() {
    function morphChildren2(ctx, oldParent, newParent, insertionPoint = null, endPoint = null) {
      if (oldParent instanceof HTMLTemplateElement && newParent instanceof HTMLTemplateElement) {
        oldParent = oldParent.content;
        newParent = newParent.content;
      }
      insertionPoint || (insertionPoint = oldParent.firstChild);
      for (const newChild of newParent.childNodes) {
        if (insertionPoint && insertionPoint != endPoint) {
          const bestMatch = findBestMatch(
            ctx,
            newChild,
            insertionPoint,
            endPoint
          );
          if (bestMatch) {
            if (bestMatch !== insertionPoint) {
              removeNodesBetween(ctx, insertionPoint, bestMatch);
            }
            morphNode(bestMatch, newChild, ctx);
            insertionPoint = bestMatch.nextSibling;
            continue;
          }
        }
        if (newChild instanceof Element) {
          const newChildId = (
            /** @type {String} */
            newChild.getAttribute("id")
          );
          if (ctx.persistentIds.has(newChildId)) {
            const movedChild = moveBeforeById(
              oldParent,
              newChildId,
              insertionPoint,
              ctx
            );
            morphNode(movedChild, newChild, ctx);
            insertionPoint = movedChild.nextSibling;
            continue;
          }
        }
        const insertedNode = createNode(
          oldParent,
          newChild,
          insertionPoint,
          ctx
        );
        if (insertedNode) {
          insertionPoint = insertedNode.nextSibling;
        }
      }
      while (insertionPoint && insertionPoint != endPoint) {
        const tempNode = insertionPoint;
        insertionPoint = insertionPoint.nextSibling;
        removeNode(ctx, tempNode);
      }
    }
    function createNode(oldParent, newChild, insertionPoint, ctx) {
      if (ctx.callbacks.beforeNodeAdded(newChild) === false) return null;
      if (ctx.idMap.has(newChild)) {
        const newEmptyChild = document.createElement(
          /** @type {Element} */
          newChild.tagName
        );
        oldParent.insertBefore(newEmptyChild, insertionPoint);
        morphNode(newEmptyChild, newChild, ctx);
        ctx.callbacks.afterNodeAdded(newEmptyChild);
        return newEmptyChild;
      } else {
        const newClonedChild = document.importNode(newChild, true);
        oldParent.insertBefore(newClonedChild, insertionPoint);
        ctx.callbacks.afterNodeAdded(newClonedChild);
        return newClonedChild;
      }
    }
    const findBestMatch = /* @__PURE__ */ (function() {
      function findBestMatch2(ctx, node, startPoint, endPoint) {
        let softMatch = null;
        let nextSibling = node.nextSibling;
        let siblingSoftMatchCount = 0;
        let cursor = startPoint;
        while (cursor && cursor != endPoint) {
          if (isSoftMatch(cursor, node)) {
            if (isIdSetMatch(ctx, cursor, node)) {
              return cursor;
            }
            if (softMatch === null) {
              if (!ctx.idMap.has(cursor)) {
                softMatch = cursor;
              }
            }
          }
          if (softMatch === null && nextSibling && isSoftMatch(cursor, nextSibling)) {
            siblingSoftMatchCount++;
            nextSibling = nextSibling.nextSibling;
            if (siblingSoftMatchCount >= 2) {
              softMatch = void 0;
            }
          }
          if (ctx.activeElementAndParents.includes(cursor)) break;
          cursor = cursor.nextSibling;
        }
        return softMatch || null;
      }
      function isIdSetMatch(ctx, oldNode, newNode) {
        let oldSet = ctx.idMap.get(oldNode);
        let newSet = ctx.idMap.get(newNode);
        if (!newSet || !oldSet) return false;
        for (const id of oldSet) {
          if (newSet.has(id)) {
            return true;
          }
        }
        return false;
      }
      function isSoftMatch(oldNode, newNode) {
        const oldElt = (
          /** @type {Element} */
          oldNode
        );
        const newElt = (
          /** @type {Element} */
          newNode
        );
        return oldElt.nodeType === newElt.nodeType && oldElt.tagName === newElt.tagName && // If oldElt has an `id` with possible state and it doesn't match newElt.id then avoid morphing.
        // We'll still match an anonymous node with an IDed newElt, though, because if it got this far,
        // its not persistent, and new nodes can't have any hidden state.
        // We can't use .id because of form input shadowing, and we can't count on .getAttribute's presence because it could be a document-fragment
        (!oldElt.getAttribute?.("id") || oldElt.getAttribute?.("id") === newElt.getAttribute?.("id"));
      }
      return findBestMatch2;
    })();
    function removeNode(ctx, node) {
      if (ctx.idMap.has(node)) {
        moveBefore(ctx.pantry, node, null);
      } else {
        if (ctx.callbacks.beforeNodeRemoved(node) === false) return;
        node.parentNode?.removeChild(node);
        ctx.callbacks.afterNodeRemoved(node);
      }
    }
    function removeNodesBetween(ctx, startInclusive, endExclusive) {
      let cursor = startInclusive;
      while (cursor && cursor !== endExclusive) {
        let tempNode = (
          /** @type {Node} */
          cursor
        );
        cursor = cursor.nextSibling;
        removeNode(ctx, tempNode);
      }
      return cursor;
    }
    function moveBeforeById(parentNode, id, after, ctx) {
      const target = (
        /** @type {Element} - will always be found */
        // ctx.target.id unsafe because of form input shadowing
        // ctx.target could be a document fragment which doesn't have `getAttribute`
        ctx.target.getAttribute?.("id") === id && ctx.target || ctx.target.querySelector(`[id="${id}"]`) || ctx.pantry.querySelector(`[id="${id}"]`)
      );
      removeElementFromAncestorsIdMaps(target, ctx);
      moveBefore(parentNode, target, after);
      return target;
    }
    function removeElementFromAncestorsIdMaps(element, ctx) {
      const id = (
        /** @type {String} */
        element.getAttribute("id")
      );
      while (element = element.parentNode) {
        let idSet = ctx.idMap.get(element);
        if (idSet) {
          idSet.delete(id);
          if (!idSet.size) {
            ctx.idMap.delete(element);
          }
        }
      }
    }
    function moveBefore(parentNode, element, after) {
      if (parentNode.moveBefore) {
        try {
          parentNode.moveBefore(element, after);
        } catch (e) {
          parentNode.insertBefore(element, after);
        }
      } else {
        parentNode.insertBefore(element, after);
      }
    }
    return morphChildren2;
  })();
  const morphNode = /* @__PURE__ */ (function() {
    function morphNode2(oldNode, newContent, ctx) {
      if (ctx.ignoreActive && oldNode === document.activeElement) {
        return null;
      }
      if (ctx.callbacks.beforeNodeMorphed(oldNode, newContent) === false) {
        return oldNode;
      }
      if (oldNode instanceof HTMLHeadElement && ctx.head.ignore) {
      } else if (oldNode instanceof HTMLHeadElement && ctx.head.style !== "morph") {
        handleHeadElement(
          oldNode,
          /** @type {HTMLHeadElement} */
          newContent,
          ctx
        );
      } else {
        morphAttributes(oldNode, newContent, ctx);
        if (!ignoreValueOfActiveElement(oldNode, ctx)) {
          morphChildren(ctx, oldNode, newContent);
        }
      }
      ctx.callbacks.afterNodeMorphed(oldNode, newContent);
      return oldNode;
    }
    function morphAttributes(oldNode, newNode, ctx) {
      let type = newNode.nodeType;
      if (type === 1) {
        const oldElt = (
          /** @type {Element} */
          oldNode
        );
        const newElt = (
          /** @type {Element} */
          newNode
        );
        const oldAttributes = oldElt.attributes;
        const newAttributes = newElt.attributes;
        for (const newAttribute of newAttributes) {
          if (ignoreAttribute(newAttribute.name, oldElt, "update", ctx)) {
            continue;
          }
          if (oldElt.getAttribute(newAttribute.name) !== newAttribute.value) {
            oldElt.setAttribute(newAttribute.name, newAttribute.value);
          }
        }
        for (let i = oldAttributes.length - 1; 0 <= i; i--) {
          const oldAttribute = oldAttributes[i];
          if (!oldAttribute) continue;
          if (!newElt.hasAttribute(oldAttribute.name)) {
            if (ignoreAttribute(oldAttribute.name, oldElt, "remove", ctx)) {
              continue;
            }
            oldElt.removeAttribute(oldAttribute.name);
          }
        }
        if (!ignoreValueOfActiveElement(oldElt, ctx)) {
          syncInputValue(oldElt, newElt, ctx);
        }
      }
      if (type === 8 || type === 3) {
        if (oldNode.nodeValue !== newNode.nodeValue) {
          oldNode.nodeValue = newNode.nodeValue;
        }
      }
    }
    function syncInputValue(oldElement, newElement, ctx) {
      if (oldElement instanceof HTMLInputElement && newElement instanceof HTMLInputElement && newElement.type !== "file") {
        let newValue = newElement.value;
        let oldValue = oldElement.value;
        syncBooleanAttribute(oldElement, newElement, "checked", ctx);
        syncBooleanAttribute(oldElement, newElement, "disabled", ctx);
        if (!newElement.hasAttribute("value")) {
          if (!ignoreAttribute("value", oldElement, "remove", ctx)) {
            oldElement.value = "";
            oldElement.removeAttribute("value");
          }
        } else if (oldValue !== newValue) {
          if (!ignoreAttribute("value", oldElement, "update", ctx)) {
            oldElement.setAttribute("value", newValue);
            oldElement.value = newValue;
          }
        }
      } else if (oldElement instanceof HTMLOptionElement && newElement instanceof HTMLOptionElement) {
        syncBooleanAttribute(oldElement, newElement, "selected", ctx);
      } else if (oldElement instanceof HTMLTextAreaElement && newElement instanceof HTMLTextAreaElement) {
        let newValue = newElement.value;
        let oldValue = oldElement.value;
        if (ignoreAttribute("value", oldElement, "update", ctx)) {
          return;
        }
        if (newValue !== oldValue) {
          oldElement.value = newValue;
        }
        if (oldElement.firstChild && oldElement.firstChild.nodeValue !== newValue) {
          oldElement.firstChild.nodeValue = newValue;
        }
      }
    }
    function syncBooleanAttribute(oldElement, newElement, attributeName, ctx) {
      const newLiveValue = newElement[attributeName], oldLiveValue = oldElement[attributeName];
      if (newLiveValue !== oldLiveValue) {
        const ignoreUpdate = ignoreAttribute(
          attributeName,
          oldElement,
          "update",
          ctx
        );
        if (!ignoreUpdate) {
          oldElement[attributeName] = newElement[attributeName];
        }
        if (newLiveValue) {
          if (!ignoreUpdate) {
            oldElement.setAttribute(attributeName, "");
          }
        } else {
          if (!ignoreAttribute(attributeName, oldElement, "remove", ctx)) {
            oldElement.removeAttribute(attributeName);
          }
        }
      }
    }
    function ignoreAttribute(attr, element, updateType, ctx) {
      if (attr === "value" && ctx.ignoreActiveValue && element === document.activeElement) {
        return true;
      }
      return ctx.callbacks.beforeAttributeUpdated(attr, element, updateType) === false;
    }
    function ignoreValueOfActiveElement(possibleActiveElement, ctx) {
      return !!ctx.ignoreActiveValue && possibleActiveElement === document.activeElement && possibleActiveElement !== document.body;
    }
    return morphNode2;
  })();
  function withHeadBlocking(ctx, oldNode, newNode, callback) {
    if (ctx.head.block) {
      const oldHead = oldNode.querySelector("head");
      const newHead = newNode.querySelector("head");
      if (oldHead && newHead) {
        const promises = handleHeadElement(oldHead, newHead, ctx);
        return Promise.all(promises).then(() => {
          const newCtx = Object.assign(ctx, {
            head: {
              block: false,
              ignore: true
            }
          });
          return callback(newCtx);
        });
      }
    }
    return callback(ctx);
  }
  function handleHeadElement(oldHead, newHead, ctx) {
    let added = [];
    let removed = [];
    let preserved = [];
    let nodesToAppend = [];
    let srcToNewHeadNodes = /* @__PURE__ */ new Map();
    for (const newHeadChild of newHead.children) {
      srcToNewHeadNodes.set(newHeadChild.outerHTML, newHeadChild);
    }
    for (const currentHeadElt of oldHead.children) {
      let inNewContent = srcToNewHeadNodes.has(currentHeadElt.outerHTML);
      let isReAppended = ctx.head.shouldReAppend(currentHeadElt);
      let isPreserved = ctx.head.shouldPreserve(currentHeadElt);
      if (inNewContent || isPreserved) {
        if (isReAppended) {
          removed.push(currentHeadElt);
        } else {
          srcToNewHeadNodes.delete(currentHeadElt.outerHTML);
          preserved.push(currentHeadElt);
        }
      } else {
        if (ctx.head.style === "append") {
          if (isReAppended) {
            removed.push(currentHeadElt);
            nodesToAppend.push(currentHeadElt);
          }
        } else {
          if (ctx.head.shouldRemove(currentHeadElt) !== false) {
            removed.push(currentHeadElt);
          }
        }
      }
    }
    nodesToAppend.push(...srcToNewHeadNodes.values());
    let promises = [];
    for (const newNode of nodesToAppend) {
      let newElt = (
        /** @type {ChildNode} */
        document.createRange().createContextualFragment(newNode.outerHTML).firstChild
      );
      if (ctx.callbacks.beforeNodeAdded(newElt) !== false) {
        if ("href" in newElt && newElt.href || "src" in newElt && newElt.src) {
          let resolve;
          let promise = new Promise(function(_resolve) {
            resolve = _resolve;
          });
          newElt.addEventListener("load", function() {
            resolve();
          });
          promises.push(promise);
        }
        oldHead.appendChild(newElt);
        ctx.callbacks.afterNodeAdded(newElt);
        added.push(newElt);
      }
    }
    for (const removedElement of removed) {
      if (ctx.callbacks.beforeNodeRemoved(removedElement) !== false) {
        oldHead.removeChild(removedElement);
        ctx.callbacks.afterNodeRemoved(removedElement);
      }
    }
    ctx.head.afterHeadMorphed(oldHead, {
      added,
      kept: preserved,
      removed
    });
    return promises;
  }
  const createMorphContext = /* @__PURE__ */ (function() {
    function createMorphContext2(oldNode, newContent, config) {
      const { persistentIds, idMap } = createIdMaps(oldNode, newContent);
      const mergedConfig = mergeDefaults(config);
      const morphStyle = mergedConfig.morphStyle || "outerHTML";
      if (!["innerHTML", "outerHTML"].includes(morphStyle)) {
        throw `Do not understand how to morph style ${morphStyle}`;
      }
      return {
        target: oldNode,
        newContent,
        config: mergedConfig,
        morphStyle,
        ignoreActive: mergedConfig.ignoreActive,
        ignoreActiveValue: mergedConfig.ignoreActiveValue,
        restoreFocus: mergedConfig.restoreFocus,
        idMap,
        persistentIds,
        pantry: createPantry(),
        activeElementAndParents: createActiveElementAndParents(oldNode),
        callbacks: mergedConfig.callbacks,
        head: mergedConfig.head
      };
    }
    function mergeDefaults(config) {
      let finalConfig = Object.assign({}, defaults);
      Object.assign(finalConfig, config);
      finalConfig.callbacks = Object.assign(
        {},
        defaults.callbacks,
        config.callbacks
      );
      finalConfig.head = Object.assign({}, defaults.head, config.head);
      return finalConfig;
    }
    function createPantry() {
      const pantry = document.createElement("div");
      pantry.hidden = true;
      document.body.insertAdjacentElement("afterend", pantry);
      return pantry;
    }
    function createActiveElementAndParents(oldNode) {
      let activeElementAndParents = [];
      let elt = document.activeElement;
      if (elt?.tagName !== "BODY" && oldNode.contains(elt)) {
        while (elt) {
          activeElementAndParents.push(elt);
          if (elt === oldNode) break;
          elt = elt.parentElement;
        }
      }
      return activeElementAndParents;
    }
    function findIdElements(root) {
      let elements = Array.from(root.querySelectorAll("[id]"));
      if (root.getAttribute?.("id")) {
        elements.push(root);
      }
      return elements;
    }
    function populateIdMapWithTree(idMap, persistentIds, root, elements) {
      for (const elt of elements) {
        const id = (
          /** @type {String} */
          elt.getAttribute("id")
        );
        if (persistentIds.has(id)) {
          let current = elt;
          while (current) {
            let idSet = idMap.get(current);
            if (idSet == null) {
              idSet = /* @__PURE__ */ new Set();
              idMap.set(current, idSet);
            }
            idSet.add(id);
            if (current === root) break;
            current = current.parentElement;
          }
        }
      }
    }
    function createIdMaps(oldContent, newContent) {
      const oldIdElements = findIdElements(oldContent);
      const newIdElements = findIdElements(newContent);
      const persistentIds = createPersistentIds(oldIdElements, newIdElements);
      let idMap = /* @__PURE__ */ new Map();
      populateIdMapWithTree(idMap, persistentIds, oldContent, oldIdElements);
      const newRoot = newContent.__idiomorphRoot || newContent;
      populateIdMapWithTree(idMap, persistentIds, newRoot, newIdElements);
      return { persistentIds, idMap };
    }
    function createPersistentIds(oldIdElements, newIdElements) {
      let duplicateIds = /* @__PURE__ */ new Set();
      let oldIdTagNameMap = /* @__PURE__ */ new Map();
      for (const { id, tagName } of oldIdElements) {
        if (oldIdTagNameMap.has(id)) {
          duplicateIds.add(id);
        } else {
          oldIdTagNameMap.set(id, tagName);
        }
      }
      let persistentIds = /* @__PURE__ */ new Set();
      for (const { id, tagName } of newIdElements) {
        if (persistentIds.has(id)) {
          duplicateIds.add(id);
        } else if (oldIdTagNameMap.get(id) === tagName) {
          persistentIds.add(id);
        }
      }
      for (const id of duplicateIds) {
        persistentIds.delete(id);
      }
      return persistentIds;
    }
    return createMorphContext2;
  })();
  const { normalizeElement, normalizeParent } = /* @__PURE__ */ (function() {
    const generatedByIdiomorph = /* @__PURE__ */ new WeakSet();
    function normalizeElement2(content) {
      if (content instanceof Document) {
        return content.documentElement;
      } else {
        return content;
      }
    }
    function normalizeParent2(newContent) {
      if (newContent == null) {
        return document.createElement("div");
      } else if (typeof newContent === "string") {
        return normalizeParent2(parseContent(newContent));
      } else if (generatedByIdiomorph.has(
        /** @type {Element} */
        newContent
      )) {
        return (
          /** @type {Element} */
          newContent
        );
      } else if (newContent instanceof Node) {
        if (newContent.parentNode) {
          return (
            /** @type {any} */
            new SlicedParentNode(newContent)
          );
        } else {
          const dummyParent = document.createElement("div");
          dummyParent.append(newContent);
          return dummyParent;
        }
      } else {
        const dummyParent = document.createElement("div");
        for (const elt of [...newContent]) {
          dummyParent.append(elt);
        }
        return dummyParent;
      }
    }
    class SlicedParentNode {
      /** @param {Node} node */
      constructor(node) {
        this.originalNode = node;
        this.realParentNode = /** @type {Element} */
        node.parentNode;
        this.previousSibling = node.previousSibling;
        this.nextSibling = node.nextSibling;
      }
      /** @returns {Node[]} */
      get childNodes() {
        const nodes = [];
        let cursor = this.previousSibling ? this.previousSibling.nextSibling : this.realParentNode.firstChild;
        while (cursor && cursor != this.nextSibling) {
          nodes.push(cursor);
          cursor = cursor.nextSibling;
        }
        return nodes;
      }
      /**
       * @param {string} selector
       * @returns {Element[]}
       */
      querySelectorAll(selector) {
        return this.childNodes.reduce(
          (results, node) => {
            if (node instanceof Element) {
              if (node.matches(selector)) results.push(node);
              const nodeList = node.querySelectorAll(selector);
              for (let i = 0; i < nodeList.length; i++) {
                results.push(nodeList[i]);
              }
            }
            return results;
          },
          /** @type {Element[]} */
          []
        );
      }
      /**
       * @param {Node} node
       * @param {Node} referenceNode
       * @returns {Node}
       */
      insertBefore(node, referenceNode) {
        return this.realParentNode.insertBefore(node, referenceNode);
      }
      /**
       * @param {Node} node
       * @param {Node} referenceNode
       * @returns {Node}
       */
      moveBefore(node, referenceNode) {
        return this.realParentNode.moveBefore(node, referenceNode);
      }
      /**
       * for later use with populateIdMapWithTree to halt upwards iteration
       * @returns {Node}
       */
      get __idiomorphRoot() {
        return this.originalNode;
      }
    }
    function parseContent(newContent) {
      let parser = new DOMParser();
      let contentWithSvgsRemoved = newContent.replace(
        /<svg(\s[^>]*>|>)([\s\S]*?)<\/svg>/gim,
        ""
      );
      if (contentWithSvgsRemoved.match(/<\/html>/) || contentWithSvgsRemoved.match(/<\/head>/) || contentWithSvgsRemoved.match(/<\/body>/)) {
        let content = parser.parseFromString(newContent, "text/html");
        if (contentWithSvgsRemoved.match(/<\/html>/)) {
          generatedByIdiomorph.add(content);
          return content;
        } else {
          let htmlElement = content.firstChild;
          if (htmlElement) {
            generatedByIdiomorph.add(htmlElement);
          }
          return htmlElement;
        }
      } else {
        let responseDoc = parser.parseFromString(
          "<body><template>" + newContent + "</template></body>",
          "text/html"
        );
        let content = (
          /** @type {HTMLTemplateElement} */
          responseDoc.body.querySelector("template").content
        );
        generatedByIdiomorph.add(content);
        return content;
      }
    }
    return { normalizeElement: normalizeElement2, normalizeParent: normalizeParent2 };
  })();
  return {
    morph,
    defaults
  };
})();

// src/index.js
var NavigationFallback = class extends Error {
  constructor(url, message) {
    super(message);
    this.name = "NavigationFallback";
    this.url = url;
  }
};
var positiveNumber = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
};
var nonNegativeNumber = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
};
var unique = (values) => [...new Set(values.filter(Boolean))];
var withRequestedHash = (url, finalURL) => {
  const requested = new URL(url, window.location.href);
  if (!requested.hash || finalURL.includes("#")) return finalURL;
  const destination = new URL(finalURL, requested);
  destination.hash = requested.hash;
  return destination.href;
};
var attributeSignature = (node, prefixes) => {
  if (node?.nodeType !== globalThis.Node?.ELEMENT_NODE) return null;
  return Array.from(node.attributes).filter((attribute) => prefixes.some((prefix) => attribute.name.startsWith(prefix))).map((attribute) => `${attribute.name}=${attribute.value}`).sort().join("\n");
};
var Morpheus = class {
  constructor(options = {}) {
    this.targetSelector = options.target || "main";
    this.prefetching = options.prefetching ?? options.prefetch ?? true;
    this.prefetchDelay = nonNegativeNumber(options.prefetchDelay, 75);
    this.cacheSize = positiveNumber(options.cacheSize, 20);
    this.cacheTTL = positiveNumber(options.cacheTTL, 15) * 1e3;
    this.eventPrefix = options.eventPrefix || "morpheus";
    this.eventAliases = unique(options.eventAliases || []);
    this.historyKey = options.historyKey || "morpheus";
    this.historyAliases = unique(options.historyAliases || []);
    this.navigationOffSelector = options.navigationOffSelector || '[data-morpheus="off"], [data-morpheus-navigation="off"]';
    this.prefetchOffSelector = options.prefetchOffSelector || '[data-morpheus-prefetch="off"]';
    this.permanentSelector = options.permanentSelector || "[data-morpheus-permanent]";
    this.activeLinkSelector = options.activeLinkSelector ?? "[data-morpheus-active-prefix]";
    this.loadingAttributes = unique(
      options.loadingAttributes || ["data-morpheus-navigating"]
    );
    this.navigationHeaders = {
      "X-Morpheus-Navigation": "true",
      ...options.navigationHeaders || {}
    };
    this.prefetchHeaders = {
      "X-Morpheus-Prefetch": "true",
      ...options.prefetchHeaders || {}
    };
    this.responseNavigationHeader = options.responseNavigationHeader || null;
    this.responseNavigationValue = options.responseNavigationValue || "morph";
    this.responseReloadValue = options.responseReloadValue || "reload";
    this.titleHeader = options.titleHeader || null;
    this.prefetchCacheHeader = options.prefetchCacheHeader || null;
    this.validateResponse = options.validateResponse || null;
    this.replaceOnAttributePrefixes = unique(options.replaceOnAttributePrefixes || []);
    this.beforeNodeMorphed = options.beforeNodeMorphed || null;
    this.afterNodeMorphed = options.afterNodeMorphed || null;
    this.logger = options.logger || globalThis.console;
    this.morpher = options.morpher || Idiomorph;
    this.cache = /* @__PURE__ */ new Map();
    this.sequence = 0;
    this.controller = null;
    this.prefetchTimer = null;
    this.initialFrame = null;
    this.activeNavigation = null;
    this.scrollPositions = /* @__PURE__ */ new Map();
    this.started = false;
    this.boundClick = (event) => this.handleClick(event);
    this.boundPopState = (event) => this.handlePopState(event);
    this.boundPrefetchIntent = (event) => this.handlePrefetchIntent(event);
    this.boundInvalidate = () => this.clearCache();
    this.boundScroll = () => {
      if (this.activeNavigation) return;
      const entry = this.historyEntry(history.state);
      if (entry?.id) {
        this.scrollPositions.set(entry.id, { x: window.scrollX, y: window.scrollY });
      }
    };
  }
  get eventPrefixes() {
    return unique([this.eventPrefix, ...this.eventAliases]);
  }
  get historyKeys() {
    return unique([this.historyKey, ...this.historyAliases]);
  }
  start() {
    if (this.started) return this;
    this.started = true;
    this.previousScrollRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
    this.rememberScroll();
    document.addEventListener("click", this.boundClick);
    window.addEventListener("popstate", this.boundPopState);
    window.addEventListener("scroll", this.boundScroll, { passive: true });
    document.addEventListener("mouseover", this.boundPrefetchIntent);
    document.addEventListener("focusin", this.boundPrefetchIntent);
    document.addEventListener("touchstart", this.boundPrefetchIntent, { passive: true });
    for (const prefix of this.eventPrefixes) {
      document.addEventListener(`${prefix}:invalidate`, this.boundInvalidate);
    }
    this.updateActiveLinks();
    this.initialFrame = requestAnimationFrame(() => {
      this.initialFrame = null;
      this.dispatch("load", {
        url: window.location.href,
        navigationType: "initial",
        prefetched: false,
        target: document.querySelector(this.targetSelector)
      });
    });
    return this;
  }
  stop() {
    ++this.sequence;
    if (!this.started && !this.activeNavigation) return this;
    if (this.started && !this.activeNavigation) this.rememberScroll();
    document.removeEventListener("click", this.boundClick);
    window.removeEventListener("popstate", this.boundPopState);
    window.removeEventListener("scroll", this.boundScroll);
    document.removeEventListener("mouseover", this.boundPrefetchIntent);
    document.removeEventListener("focusin", this.boundPrefetchIntent);
    document.removeEventListener("touchstart", this.boundPrefetchIntent);
    for (const prefix of this.eventPrefixes) {
      document.removeEventListener(`${prefix}:invalidate`, this.boundInvalidate);
    }
    clearTimeout(this.prefetchTimer);
    if (this.initialFrame !== null) cancelAnimationFrame(this.initialFrame);
    this.initialFrame = null;
    this.controller?.abort();
    this.controller = null;
    if (this.started) history.scrollRestoration = this.previousScrollRestoration;
    this.started = false;
    const detail = this.activeNavigation;
    this.activeNavigation = null;
    if (detail) this.setLoading(false, detail);
    return this;
  }
  handleClick(event) {
    const link = this.eligibleLink(event.target);
    if (!link || !this.eligibleClick(event, link)) return;
    const url = new URL(link.href, window.location.href);
    if (this.onlyChangesHash(url)) return;
    const detail = { url: url.href, link, navigationType: "link" };
    if (!this.dispatch("before-navigate", detail, true)) return;
    event.preventDefault();
    this.rememberScroll();
    void this.navigate(url.href, { historyMode: "push", navigationType: "link" });
  }
  handlePopState(event) {
    const detail = { url: window.location.href, navigationType: "popstate" };
    if (!this.dispatch("before-navigate", detail, true)) {
      window.location.reload();
      return;
    }
    const entry = this.historyEntry(event.state);
    const scroll = this.scrollPositions.get(entry?.id) || entry?.scroll;
    void this.navigate(window.location.href, {
      historyMode: "pop",
      navigationType: "popstate",
      scroll
    });
  }
  handlePrefetchIntent(event) {
    if (!this.prefetchEnabled()) return;
    const link = this.eligibleLink(event.target);
    if (!link || !this.eligibleURL(new URL(link.href, window.location.href))) return;
    if (link.closest(this.prefetchOffSelector)) return;
    if (event.type === "mouseover" && link.contains(event.relatedTarget)) return;
    clearTimeout(this.prefetchTimer);
    const delay = event.type === "mouseover" ? this.prefetchDelay : 0;
    this.prefetchTimer = setTimeout(() => void this.prefetch(link.href), delay);
  }
  async navigate(url, options = {}) {
    const sequence = ++this.sequence;
    this.controller?.abort();
    this.controller = null;
    this.activeNavigation = { url, navigationType: options.navigationType };
    this.setLoading(true, this.activeNavigation);
    try {
      if (sequence !== this.sequence) return;
      let prefetched = false;
      let page = await this.takePrefetch(url);
      if (sequence !== this.sequence) return;
      if (page?.cacheable) {
        prefetched = true;
      } else {
        this.controller = new AbortController();
        page = await this.fetchPage(url, { signal: this.controller.signal });
      }
      if (sequence !== this.sequence) return;
      page = { ...page, url: withRequestedHash(url, page.url) };
      const beforeMorph = {
        url: page.url,
        navigationType: options.navigationType,
        prefetched,
        newTarget: page.target
      };
      if (!this.dispatch("before-morph", beforeMorph, true)) {
        throw new NavigationFallback(page.url, "morph was cancelled");
      }
      if (sequence !== this.sequence) return;
      this.morph(page);
      if (sequence !== this.sequence) return;
      this.updateHistory(page.url, options.historyMode);
      await this.nextFrame();
      if (sequence !== this.sequence) return;
      this.restoreScroll(page.url, options);
      this.manageFocus(page.url, options.navigationType);
      this.updateActiveLinks();
      this.dispatch("load", {
        url: page.url,
        navigationType: options.navigationType,
        prefetched,
        target: document.querySelector(this.targetSelector)
      });
    } catch (error) {
      if (error?.name === "AbortError" || sequence !== this.sequence) return;
      const fallbackURL = error instanceof NavigationFallback ? error.url : url;
      this.dispatch("navigation-error", { url: fallbackURL, error });
      this.fullLoad(fallbackURL, options.historyMode === "pop");
    } finally {
      if (sequence === this.sequence) {
        this.controller = null;
        this.activeNavigation = null;
        this.setLoading(false, { url, navigationType: options.navigationType });
      }
    }
  }
  async fetchPage(url, { prefetch = false, signal } = {}) {
    const response = await fetch(url, {
      method: "GET",
      credentials: "same-origin",
      redirect: "follow",
      signal,
      headers: {
        Accept: "text/html",
        ...this.navigationHeaders,
        ...prefetch ? this.prefetchHeaders : {}
      }
    });
    const finalURL = withRequestedHash(url, response.url || url);
    if (!response.ok) throw new NavigationFallback(finalURL, `HTTP ${response.status}`);
    if (!this.eligibleURL(new URL(finalURL, window.location.href))) {
      throw new NavigationFallback(finalURL, "redirected outside the current origin");
    }
    this.checkResponseContract(response, finalURL);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("text/html")) {
      throw new NavigationFallback(finalURL, "response is not HTML");
    }
    const source = await response.text();
    const parsed = new DOMParser().parseFromString(source, "text/html");
    const target = parsed.querySelector(this.targetSelector);
    if (!target) throw new NavigationFallback(finalURL, "navigation target is missing");
    const cacheControl = response.headers.get("cache-control") || "";
    const prefetchPolicy = this.prefetchCacheHeader ? response.headers.get(this.prefetchCacheHeader) : null;
    return {
      url: finalURL,
      target,
      title: this.titleHeader && response.headers.get(this.titleHeader) || parsed.title,
      cacheable: !cacheControl.toLowerCase().includes("no-store") && prefetchPolicy?.toLowerCase() !== "no-store"
    };
  }
  checkResponseContract(response, finalURL) {
    if (this.responseNavigationHeader) {
      const value = response.headers.get(this.responseNavigationHeader);
      if (value === this.responseReloadValue) {
        throw new NavigationFallback(finalURL, "response requested a reload");
      }
      if (value !== this.responseNavigationValue) {
        throw new NavigationFallback(finalURL, "response is not navigable");
      }
    }
    if (this.validateResponse) {
      const result = this.validateResponse(response);
      if (result === false) {
        throw new NavigationFallback(finalURL, "response was rejected");
      }
      if (typeof result === "string") throw new NavigationFallback(finalURL, result);
    }
  }
  morph(page) {
    const current = document.querySelector(this.targetSelector);
    if (!current) {
      throw new NavigationFallback(page.url, "current navigation target is missing");
    }
    const replacements = [];
    this.morpher.morph(current, page.target, {
      morphStyle: "outerHTML",
      restoreFocus: false,
      callbacks: {
        beforeNodeMorphed: (oldNode, newNode) => {
          if (oldNode.nodeType === Node.ELEMENT_NODE && oldNode.matches(this.permanentSelector)) {
            return false;
          }
          if (this.attributesRequireReplacement(oldNode, newNode)) {
            replacements.push([oldNode, newNode.cloneNode(true)]);
            return false;
          }
          return this.beforeNodeMorphed?.(oldNode, newNode);
        },
        afterNodeMorphed: (oldNode, newNode) => {
          this.afterNodeMorphed?.(oldNode, newNode);
        }
      }
    });
    for (const [oldNode, replacement] of replacements) {
      if (oldNode.isConnected) oldNode.replaceWith(replacement);
    }
    if (page.title) document.title = page.title;
  }
  attributesRequireReplacement(oldNode, newNode) {
    if (this.replaceOnAttributePrefixes.length === 0) return false;
    const oldSignature = attributeSignature(oldNode, this.replaceOnAttributePrefixes);
    const newSignature = attributeSignature(newNode, this.replaceOnAttributePrefixes);
    return oldSignature !== null && newSignature !== null && oldSignature !== newSignature;
  }
  async prefetch(url) {
    const key = this.cacheKey(url);
    const existing = this.cache.get(key);
    if (existing && existing.expiresAt > Date.now()) return existing.promise;
    if (existing) this.cache.delete(key);
    const promise = this.fetchPage(key, { prefetch: true }).then((page) => {
      if (!page.cacheable) this.cache.delete(key);
      return page;
    }).catch((error) => {
      this.cache.delete(key);
      if (!(error instanceof NavigationFallback)) {
        this.logger?.debug?.("Morpheus prefetch failed", error);
      }
      return null;
    });
    this.cache.set(key, { promise, expiresAt: Date.now() + this.cacheTTL });
    this.pruneCache();
    return promise;
  }
  async takePrefetch(url) {
    const key = this.cacheKey(url);
    const entry = this.cache.get(key);
    if (!entry) return null;
    this.cache.delete(key);
    if (entry.expiresAt <= Date.now()) return null;
    return entry.promise;
  }
  pruneCache() {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (entry.expiresAt <= now) this.cache.delete(key);
    }
    while (this.cache.size > this.cacheSize) {
      this.cache.delete(this.cache.keys().next().value);
    }
  }
  clearCache() {
    this.cache.clear();
  }
  eligibleClick(event, link) {
    return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && !event.defaultPrevented && (!link.target || link.target === "_self");
  }
  eligibleLink(node) {
    const link = node instanceof Element ? node.closest("a[href]") : null;
    if (!link || link.hasAttribute("download")) return null;
    if (link.closest(this.navigationOffSelector)) return null;
    if (link.relList.contains("external")) return null;
    const url = new URL(link.href, window.location.href);
    return this.eligibleURL(url) ? link : null;
  }
  eligibleURL(url) {
    return url.origin === window.location.origin && ["http:", "https:"].includes(url.protocol);
  }
  onlyChangesHash(url) {
    return url.pathname === window.location.pathname && url.search === window.location.search && Boolean(url.hash) && url.hash !== window.location.hash;
  }
  prefetchEnabled() {
    const connection = navigator.connection;
    return this.prefetching !== false && !connection?.saveData && !["slow-2g", "2g"].includes(connection?.effectiveType);
  }
  cacheKey(url) {
    const value = new URL(url, window.location.href);
    value.hash = "";
    return value.href;
  }
  rememberScroll() {
    const state = history.state || {};
    const previousEntry = this.historyEntry(state);
    const entry = {
      id: previousEntry?.id || this.newHistoryID(),
      url: window.location.href,
      scroll: { x: window.scrollX, y: window.scrollY }
    };
    this.scrollPositions.set(entry.id, entry.scroll);
    const nextState = { ...state };
    for (const key of this.historyKeys) {
      nextState[key] = { ...state[key] || {}, ...entry };
    }
    history.replaceState(nextState, "", window.location.href);
  }
  updateHistory(url, mode) {
    const entry = { id: this.newHistoryID(), url, scroll: { x: 0, y: 0 } };
    const state = Object.fromEntries(this.historyKeys.map((key) => [key, entry]));
    if (mode === "push") history.pushState(state, "", url);
    else if (mode === "pop" && url !== window.location.href) {
      history.replaceState(state, "", url);
    }
  }
  historyEntry(state) {
    return this.historyKeys.map((key) => state?.[key]).find((entry) => entry?.scroll);
  }
  newHistoryID() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
  restoreScroll(url, options) {
    if (options.historyMode === "pop" && options.scroll) {
      window.scrollTo(options.scroll.x || 0, options.scroll.y || 0);
      return;
    }
    const hash = new URL(url, window.location.href).hash;
    const anchor = this.anchorFor(hash);
    if (anchor) anchor.scrollIntoView();
    else window.scrollTo(0, 0);
  }
  manageFocus(url, navigationType) {
    if (navigationType === "popstate") return;
    const hash = new URL(url, window.location.href).hash;
    const target = this.anchorFor(hash) || document.querySelector(`${this.targetSelector} [autofocus]`) || document.querySelector(this.targetSelector);
    if (!target) return;
    const addedTabIndex = !target.hasAttribute("tabindex") && !target.matches("a,button,input,select,textarea");
    if (addedTabIndex) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    if (addedTabIndex) {
      target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
    }
  }
  updateActiveLinks() {
    if (!this.activeLinkSelector) return;
    const path = window.location.pathname;
    document.querySelectorAll(this.activeLinkSelector).forEach((link) => {
      const prefix = link.getAttribute("data-morpheus-active-prefix") || "/";
      const normalized = prefix.replace(/\/$/, "") || "/";
      const active = normalized === "/" ? path === "/" : path === normalized || path.startsWith(`${normalized}/`);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }
  anchorFor(hash) {
    if (!hash) return null;
    try {
      return document.getElementById(decodeURIComponent(hash.slice(1)));
    } catch {
      return null;
    }
  }
  nextFrame() {
    return new Promise((resolve) => requestAnimationFrame(resolve));
  }
  setLoading(loading, detail) {
    const root = document.documentElement;
    const target = document.querySelector(this.targetSelector);
    if (loading) {
      for (const attribute of this.loadingAttributes) root.setAttribute(attribute, "");
      target?.setAttribute("aria-busy", "true");
      this.dispatch("navigation-start", detail);
    } else {
      for (const attribute of this.loadingAttributes) root.removeAttribute(attribute);
      target?.removeAttribute("aria-busy");
      this.dispatch("navigation-end", detail);
    }
  }
  dispatch(name, detail, cancelable = false) {
    let accepted = true;
    for (const prefix of this.eventPrefixes) {
      const event = new CustomEvent(`${prefix}:${name}`, { detail, cancelable });
      if (!document.dispatchEvent(event)) accepted = false;
    }
    return accepted;
  }
  fullLoad(url, replace = false) {
    if (replace) window.location.replace(url);
    else window.location.assign(url);
  }
};
var index_default = Morpheus;

// src/adapters/swifty.js
var SwiftyNavigation = class extends index_default {
  constructor(options = {}) {
    super({
      eventAliases: ["swifty"],
      historyAliases: ["swifty"],
      navigationOffSelector: '[data-morpheus="off"], [data-morpheus-navigation="off"], [data-swifty-navigation="off"]',
      prefetchOffSelector: '[data-morpheus-prefetch="off"], [data-swifty-prefetch="off"]',
      permanentSelector: "[data-morpheus-permanent], [data-swifty-permanent]",
      loadingAttributes: ["data-morpheus-navigating", "data-swifty-navigating"],
      navigationHeaders: { "X-Swifty-Navigation": "true" },
      prefetchHeaders: { "X-Swifty-Prefetch": "true" },
      ...options
    });
  }
};
var swifty_default = SwiftyNavigation;

// src/start.js
var prefetchingFromScript = (script2) => {
  const value = script2.dataset.prefetching ?? script2.dataset.prefetch;
  return value !== "off" && value !== "false";
};
var optionsFromScript = (script2) => Object.fromEntries(
  Object.entries({
    target: script2.dataset.target,
    prefetching: prefetchingFromScript(script2),
    prefetchDelay: script2.dataset.prefetchDelay,
    cacheSize: script2.dataset.cacheSize,
    cacheTTL: script2.dataset.cacheTtl
  }).filter(([, value]) => value !== void 0)
);
var startNavigation = (Navigation, script2, options = {}) => {
  if (!script2 || typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }
  const navigation = new Navigation({ ...optionsFromScript(script2), ...options });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => navigation.start(), { once: true });
  } else {
    navigation.start();
  }
  return navigation;
};

// src/adapters/swifty-auto.js
var startSwiftyNavigation = (script2, options = {}) => {
  const navigation = startNavigation(swifty_default, script2, options);
  if (navigation) {
    window.morpheus = navigation;
    window.SwiftyNavigation = navigation;
    window.Morpheus || (window.Morpheus = navigation);
  }
  return navigation;
};
var script = typeof document === "undefined" ? null : document.querySelector("script[data-swifty-navigation]");
startSwiftyNavigation(script);
var swifty_auto_default = startSwiftyNavigation;
export {
  Idiomorph,
  Morpheus,
  NavigationFallback,
  swifty_default as SwiftyNavigation,
  swifty_auto_default as default,
  startSwiftyNavigation
};
//# sourceMappingURL=swifty.auto.js.map
