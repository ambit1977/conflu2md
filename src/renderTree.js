// src/renderTree.js
export function renderPageTree(treeData, container) {
  const ul = document.createElement('ul');
  treeData.forEach(node => {
    const li = document.createElement('li');
    li.classList.add('top-level');
    li.setAttribute('data-title', node.title);
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.classList.add('page-checkbox');
    checkbox.dataset.pageId = node.id;
    checkbox.dataset.title = node.title;
    
    const titleSpan = document.createElement('span');
    titleSpan.classList.add('page-title');
    titleSpan.textContent = node.title;
    
    li.appendChild(checkbox);
    li.appendChild(titleSpan);
    
    if (node.children && node.children.length > 0) {
      li.appendChild(renderPageTree(node.children, container));
    }
    ul.appendChild(li);
  });
  return ul;
}
