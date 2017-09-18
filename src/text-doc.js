class TextDocument extends HTMLElement {

    constructor() {
        super();
        TextDocument.createElement(this);
    }

    static getName() {
        return 'text-doc';
    }

    static toTextDocument(element) {
        if (window.customElements)
            return element;

        if (element.tagName !== TextDocument.getName().toUpperCase())
            throw `Element tag name must be ${TextDocument.getName()}. ${element.tagName.toLowerCase()} is not supported.`;

        return TextDocument.createElement(element);
    }


    static createElement(element) {
        let shadow;
        if (element instanceof HTMLElement && element.attachShadow) {
            shadow = element.attachShadow({mode: 'closed'});
        }
        else {
            shadow = document.createElement('div');
            element.appendChild(shadow);
        }

        let container = document.createElement('div');
        container.style.display = 'block';
        container.style.boxSizing = 'border-box';
        container.style.position = 'relative';
        container.style.padding = '2px';
        container.style.margin = '0';
        container.letterSpacing = '1px';
        container.overflow = 'auto';

        let textarea = document.createElement('textarea');
        textarea.style.zIndex = 2;
        textarea.style.backgroundColor = 'transparent';
        textarea.style.minHeight = '30px';

        let div = document.createElement('div');
        div.style.zIndex = 1;
        div.style.color = 'transparent';

        const setStyle = (style, value) => {
            textarea.style[style] = value;
            div.style[style] = value;
        };

        setStyle('display', 'block');
        setStyle('padding', 'inherit');
        setStyle('margin', 0);
        setStyle('boxSizing', 'border-box');
        setStyle('position', 'absolute');
        setStyle('top', 0);
        setStyle('right', 0);
        setStyle('bottom', 0);
        setStyle('left', 0);
        setStyle('whiteSpace', 'pre-wrap');
        setStyle('wordWrap', 'break-word');
        setStyle('font', "16px/20px 'Arial', 'sans-serif'");
        setStyle('letterSpacing', '1px');

        for (let key in textarea) {
            let value = textarea[key];
            if (value instanceof Function) {
                element[key] = textarea[key].bind(textarea);
            }
        }

        let update = () => {
            container.style.width = textarea.style.width;
            container.style.height = textarea.style.height;
            div.style.width = textarea.style.width;
            div.style.height = textarea.style.height;
        };

        let mutationObserver = new MutationObserver(update);
        mutationObserver.observe(textarea, {attributes: true, attributeFilter: ['style']});

        update();

        container.appendChild(div);
        container.appendChild(textarea);
        shadow.appendChild(container);

        let overrideProp = (obj, prop) => {
            Object.defineProperty(element, prop, {
                get: () => obj[prop],
                set: (value) => obj[prop] = value
            });
        };

        overrideProp(textarea, 'value');
        overrideProp(div, 'innerText');
        overrideProp(div, 'innerHTML');

        let sortedIndexes = null;
        let highlights = [];

        element.addHighlight = (start, end, color = '#FFFF00') => {
            if (isNaN(start) || isNaN(end))
                throw "Invalid value. Must be a number";

            sortedIndexes = null;
            highlights.push({start: start, end: end, color: color});
        };

        element.getHighlight = (start, end) => {
            const hasStart = !isNaN(start);
            const hasEnd = !isNaN(end);
            for (let i = 0; i < highlights.length; i++) {
                let highlight = highlights[i];
                if (hasStart && highlight.start !== start)
                    continue;

                if (hasEnd && highlight.end !== end)
                    continue;

                let obj = Object.assign({}, highlight);
                obj.index = i;
                return obj;
            }
            return null;
        };

        element.removeHighlight = (obj) => {
            if (obj.hasOwnProperty('start') && obj.hasOwnProperty('end')) {
                let highlight = element.getHighlight(obj.start, obj.end);
                highlights.splice(highlight.index, 1);
                sortedIndexes = null;
            }
            else if (obj.hasOwnProperty('index')) {
                highlights.splice(obj.index, 1);
                sortedIndexes = null;
            }
        };

        let sortIndexes = (a, b) => a.index - b.index;

        let isEndIndex = (index) => index.value.length === 7;

        let applyHighlights = () => {
            if (sortedIndexes === null) {
                sortedIndexes = [];
                for (let e of highlights) {
                    let start = {
                        index: e.start,
                        value: `<mark style="color: transparent; background-color: ${e.color}; font: ${textarea.style.font}">`
                    };
                    let end = {
                        pair: start,
                        index: e.end,
                        value: '</mark>'
                    };
                    start.pair = end;

                    sortedIndexes.push(start, end);
                }
                sortedIndexes.sort(sortIndexes);
            }


            let text = textarea.value;
            let length = text.length;
            for (let i = sortedIndexes.length - 1; i >= 0; i--) {
                let index = sortedIndexes[i];
                let pair = index.pair;
                if (isEndIndex(index)) {
                    if (pair.index < length)
                        text = text.substring(0, index.index) + index.value + text.substring(index.index);
                }
                else {
                    if (index.index < length)
                        text = text.substring(0, index.index) + index.value + text.substring(index.index);
                }
            }
            div.innerHTML = text;
        };

        textarea.addEventListener('input', () => applyHighlights());

        return element;
    }
}

if (window.customElements) {
    window.customElements.define('text-doc', TextDocument);
}

