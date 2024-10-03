function elid(id) {
  return document.getElementById(id);
}

function create(elementType, options, container) {
  const newElement = document.createElement(elementType);
  for (const option in options) {
    if (option === "style") {
      for (const attribute in options.style) {
        newElement.style[attribute] = options.style[attribute];
      }
    } else newElement[option] = options[option];
  }
  if (container) {
    if (container instanceof HTMLElement) container.appendChild(newElement);
    else if (typeof container === "string") document.getElementById(container).appendChild(newElement);
  }
  return newElement;
}
