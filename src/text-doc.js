class TextDocument extends HTMLElement {

    constructor() {
        super();

        let shadow = this.attachShadow({mode: 'closed'});

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

        for (var key in textarea) {
            var value = textarea[key];
            if (value instanceof Function) {
                this[key] = textarea[key].bind(textarea);
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

        let overrideProp = (element, prop) => {
            Object.defineProperty(this, prop, {
                get: () => element[prop],
                set: (value) => element[prop] = value
            });
        };

        overrideProp(textarea, 'value');
        overrideProp(div, 'innerText');
        overrideProp(div, 'innerHTML');

        let needsSort = false;
        let highlights = [];

        //start 1st priority, length 2nd priority
        let highlightsSortFn = (a, b) => (a.start - b.start) || ((b.end - b.start) - (a.end - a.start));

        this.addHighlight = (start, end, color = '#FFFF00') => {
            if (isNaN(start) || isNaN(end))
                throw "Invalid value. Must be a number";

            needsSort = true;
            highlights.push({start: start, end: end, color: color});
        };

        this.getHighlight = (start, end) => {
            const hasStart = !isNaN(start);
            const hasEnd = !isNaN(end);
            for (var i = 0; i < highlights.length; i++) {
                var highlight = highlights[i];
                if (hasStart && highlight.start !== start)
                    continue;

                if (hasEnd && highlight.end !== end)
                    continue;

                var obj = Object.assign({}, highlight);
                obj.index = i;
                return obj;
            }
            return null;
        };

        this.removeHighlight = (obj) => {
            if (obj.hasOwnProperty('start') && obj.hasOwnProperty('end')) {
                let highlight = this.getHighlight(obj.start, obj.end);
                highlights.splice(highlight.index, 1);
            }
            else if (obj.hasOwnProperty('index')) {
                highlights.splice(obj.index, 1);
            }
        };

        let createOffsetObject = () => {
            let map = {};
            let keyArr = [];
            return {
                getOffset: (index) => {

                },
                add: (start, end) => {

                }
            };
        };
        //TODO: fix multi-highlight bugs
        let applyHighlights = () => {
            if (needsSort) {
                highlights.sort(highlightsSortFn);
                needsSort = false;
            }
            let offset = createOffsetObject();
            let text = textarea.value;
            console.log(text.length, text);
            for (let highlight of highlights) {
                if (highlight.start < text.length) {
                    let open = `<mark style="color: transparent; background-color: ${highlight.color}; font: ${textarea.style.font}">`;
                    let close = '</mark>';
                    text = text.substring(0, highlight.start + offset) +
                        open +
                        text.substring(highlight.start + offset, highlight.end) +
                        close +
                        text.substring(highlight.end);
                    offset += open.length;
                }
            }
            div.innerHTML = text;
        };

        textarea.addEventListener('input', () => applyHighlights());
    }
}

customElements.define('text-doc', TextDocument);