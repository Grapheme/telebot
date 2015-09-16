'use strict';

module.exports = {
  getChildren() {
    // console.log('getting nodes');
    if (!this._children) this._children = [];
    return this._children;
  },

  addChild(node) {
    node._parent = this;
    // node._root = this.getRoot();
    if (!this._children) this._children = [];
    this._children.push(node);
    node.onAdded ? node.onAdded() : '';
  },

  getId() {
    return this.constructor.name;
  },

  parentId() {
    return this._parent ? this._parent.getId() : null;
  },


  getRoot() {

  },

  printTree() {
    function f (node, depth) {
      console.log('  '.repeat(depth) + (depth ? '┗ ' : ' ') + node.getId());
      node.getChildren().forEach(function(c) {
        f(c, depth + 1);
      });
    }

    f(this, 0);
  },

  getPath() {
    function f(node) {
      let result = [];
      if (node._parent) {
        result = result.concat(node.getId(), f(node._parent));
      } 
      return result;
    }

    return f(this).reverse().join('.');
  },

  find(path) {

    // console.log('find path!!!!', path);

    function f (node, path) {
      let names = path.split('.');
      let name = names.shift();
      let children = node.getChildren();

      // console.log('find in ', node.getId());

      if (children.length) {
        for (let n of children) {

          // console.log('find child ', n.getId(), name);

          if (n.getId() === name) {
            if (names.length === 0) {
              return n; 
            } else {
              return f(n, names.join('.'));
            }
          }
        }
      }
    }

    // console.log('find PATH', f(this, path));

    return f(this, path);
    
  }
};