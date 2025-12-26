import { PDFDocument, rgb } from "pdf-lib";

export const getPdf = (pdfId, mode, email) => {
    return new Promise((resolve, reject) => {
        fetch(`/api/pdfs/${pdfId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ mode, email })
        })
        .then(response => response.json())
        .then(data => resolve(data.pdf))
        .catch(error => reject(error));
    });
}

class BalloonEditor {
    constructor(balloonContainer, overlayContainer, pageNumber, pages) {
        this.balloon = balloonContainer;
        this.overlay = overlayContainer;
        this.pageNumber = pageNumber;
        this.pages = pages;
        this.elements = {};
        this.page = null;
        this.containerRect = null;
    }

    init(pageNumber, mode = "edit", config = null) {
        this.pageNumber = pageNumber;
        this.containerRect = this.overlay.getBoundingClientRect();

        let page = this.pages[pageNumber];
        if(!page) {
            this.pages[pageNumber] = { elements: {} };
        }

        this.page = this.pages[pageNumber];

        this.elements = this.pages[pageNumber].elements;

        if(this.elements && Object.keys(this.elements).length === 0 && config && Object.keys(config.elements).length > 0) {
            Object.entries(config.elements).forEach(([id, elementData]) => {
                let mark = document.createElement('div');
                mark.className = 'pdf-mark border-2 border-slate-500 bg-slate-300/50 rounded-md absolute';
                let rect = elementData.rect || { width: 200, height: 50, left: 50, top: 50 };
                mark.style.width = rect.width + 'px';
                mark.style.height = rect.height + 'px';
                mark.style.left = rect.left + 'px';
                mark.style.top = rect.top + 'px';
                mark.setAttribute('data-tag', 'pdf-mark');
                mark.setAttribute('data-id', id);
                if (this.overlay) this.overlay.appendChild(mark);

                let el;
                if(elementData.type === 'text') {
                    el = new TextInput(mark, elementData.fontSize, this.page, this.containerRect, mode, id);
                    el.placeholder = elementData.placeholder || "Enter text";
                } else if(elementData.type === 'radio') {
                    el = new RadioInput(mark, elementData.fontSize, elementData.layout, this.page, this.containerRect, mode, id);
                    el.options = elementData.options || [ "Option 1", "Option 2", "Option 3" ];
                } else if(elementData.type === 'checkbox') {
                    el = new CheckboxInput(mark, elementData.fontSize, elementData.layout, this.page, this.containerRect, mode, id);
                    el.options = elementData.options || [ "Option 1", "Option 2", "Option 3" ];
                }
                this.elements[id] = el;
            });
        }

        if(mode === "edit") {
            for(let id in this.elements) {
                let mark = document.createElement('div');
                mark.className = 'pdf-mark border-2 border-slate-500 bg-slate-300/50 rounded-md absolute';
                let rect = this.elements[id].rect || { width: 200, height: 50, left: 50, top: 50 };
                mark.style.width = rect.width + 'px';
                mark.style.height = rect.height + 'px';
                mark.style.left = rect.left + 'px';
                mark.style.top = rect.top + 'px';
                mark.setAttribute('data-tag', 'pdf-mark');
                mark.setAttribute('data-id', id);
                
                if (this.overlay) this.overlay.appendChild(mark);
                this.elements[id].mark = mark;
                this.elements[id].mode = mode;
                this.elements[id].render();

                mark.oncontextmenu = (ev) => {
                    ev.preventDefault();
                    this.show(mark.offsetLeft + mark.offsetWidth / 2, mark.offsetTop, mark, mode, false);
                }
            }
        }
    }

    prepareData(pageNumber) {
        let pageData = {
            elements: {}
        };
        this.elements = this.pages[pageNumber].elements || this.elements || {};
        for(let id in this.elements) {
            let el = this.elements[id];
            pageData.elements[id] = el.prepareData();
        }

        return pageData;
    }

    show(x, y, mark, mode = "edit", create = true) {
        this.balloon.style.left = Math.max(0, x - this.balloon.offsetWidth / 2) + 'px';
        this.balloon.style.top = (y - 10 - this.balloon.offsetHeight) + 'px';
        this.balloon.style.visibility = 'visible';
        this.balloon.style.opacity = 1;

        let t;

        if(create) {
            this.balloon.querySelector('#type-selector').value = 'text';
            this.balloon.querySelector('#font-size').value = 20;
            this.balloon.querySelectorAll('.layout-btns').forEach(btn => btn.style.display = 'none');
            this.balloon.querySelector('.layout-btns').previousElementSibling.style.display = 'none';
            t = new TextInput(mark, 20, this.page, this.containerRect, mode);
            t.render();
        } else {
            t = this.elements[mark.getAttribute('data-id')];
            this.balloon.querySelector('#type-selector').value = t.type;
            this.balloon.querySelector('#font-size').value = t.fontSize;

            if(t.type === 'text') {
                this.balloon.querySelectorAll('.layout-btns').forEach(btn => btn.style.display = 'none');
                this.balloon.querySelector('.layout-btns').previousElementSibling.style.display = 'none';
            } else if(t.type === 'radio' || t.type === 'checkbox') {
                this.balloon.querySelectorAll('.layout-btns').forEach(btn => btn.style.display = 'flex');
                this.balloon.querySelector('.layout-btns').previousElementSibling.style.display = 'flex';
            }
        }

        this.balloon.querySelector('#font-size').oninput = (e) => {
            t.resizeFont(parseInt(e.target.value));
        }

        this.balloon.querySelector("#delete-btn").onclick = () => {
            mark.remove();
            delete this.elements[t.id];

            this.hide();
        }

        this.balloon.querySelector('#vertical-layout-btn').onclick = () => {
            t.changeLayout('vertical');
        }

        this.balloon.querySelector('#horizontal-layout-btn').onclick = () => {
            t.changeLayout('horizontal');
        }

        this.balloon.querySelector('#type-selector').onchange = (e) => {
            if(e.target.value === 'text') {
                let newText = new TextInput(mark, parseInt(this.balloon.querySelector('#font-size').value), this.page, this.containerRect, mode, t.id);
                newText.render();
                this.elements[t.id] = newText;
                this.balloon.querySelectorAll('.layout-btns').forEach(btn => btn.style.display = 'none');
                this.balloon.querySelector('.layout-btns').previousElementSibling.style.display = 'none';
            } else if(e.target.value === 'radio') {
                let newRadio = new RadioInput(mark, parseInt(this.balloon.querySelector('#font-size').value), 'vertical', this.page, this.containerRect, mode, t.id);
                newRadio.render();
                this.elements[t.id] = newRadio;
                this.balloon.querySelectorAll('.layout-btns').forEach(btn => btn.style.display = 'flex');
                this.balloon.querySelector('.layout-btns').previousElementSibling.style.display = 'flex';

                this.balloon.querySelector('#vertical-layout-btn').onclick = () => {
                    newRadio.changeLayout('vertical');
                }

                this.balloon.querySelector('#horizontal-layout-btn').onclick = () => {
                    newRadio.changeLayout('horizontal');
                }
            } else if(e.target.value === 'checkbox') {
                let newCheckbox = new CheckboxInput(mark, parseInt(this.balloon.querySelector('#font-size').value), 'vertical', this.page, this.containerRect, mode, t.id);
                newCheckbox.render();
                this.elements[t.id] = newCheckbox;
                this.balloon.querySelectorAll('.layout-btns').forEach(btn => btn.style.display = 'flex');
                this.balloon.querySelector('.layout-btns').previousElementSibling.style.display = 'flex';

                this.balloon.querySelector('#vertical-layout-btn').onclick = () => {
                    newCheckbox.changeLayout('vertical');
                }

                this.balloon.querySelector('#horizontal-layout-btn').onclick = () => {
                    newCheckbox.changeLayout('horizontal');
                }
            }

            t = this.elements[t.id];
        }

        mark.oncontextmenu = (ev) => {
            ev.preventDefault();
            this.show(mark.offsetLeft + mark.offsetWidth / 2, mark.offsetTop, mark, mode, false);
        }
    }

    hide() {
       this.balloon.style.opacity = 0;
       this.balloon.style.visibility = 'hidden';
    }

    get visible() {
       return this.balloon.style.visibility === 'visible';
    }

    isTarget(e) {
        let rect = this.balloon.getBoundingClientRect();
        return e.clientX >= rect.left &&
                e.clientX <= rect.left + rect.width &&
                e.clientY >= rect.top &&
                e.clientY <= rect.top + rect.height;
    }
}

export const balloonEditor = (balloonContainer, overlayContainer, pageNumber, pages) => new BalloonEditor(balloonContainer, overlayContainer, pageNumber, pages);

class TextInput {
    constructor(mark, fontSize, page, containerRect, mode = "edit", id = null) {
        this.mark = mark;
        this.fontSize = fontSize;
        this.id = id || `text-${Date.now()}`;
        this.element;
        this.mode = mode;
        this.type = 'text';
        this.rect = mark.getBoundingClientRect();
        this.rect = { width: this.rect.width, height: this.rect.height, left: this.rect.left - containerRect.left, top: this.rect.top - containerRect.top };
        page.elements = page.elements || {};
        page.elements[this.id] = this;
        this.placeholder = "Enter text";

        mark.setAttribute('data-id', this.id);
    }

    prepareData() {
        if(this.mode === 'edit') {
            return {
                type: this.type,
                fontSize: this.fontSize,
                rect: this.rect,
                placeholder: this.placeholder
            }
        }
    }

    render() {
        this.mark.innerHTML = '';

        let input = document.createElement('input');
        input.type = 'text';
        input.className = 'border border-slate-300 rounded px-2 py-1';
        input.placeholder = this.placeholder;
        input.style.width = this.mark.style.width;
        input.style.height = this.mark.style.height;
        input.style.fontSize = `${this.fontSize}px`;
        this.mark.appendChild(input);
        input.focus();

        input.onchange = (e) => {
            if(this.mode === 'edit') {
                input.placeholder = e.target.value;
                this.placeholder = e.target.value;
                input.value = '';
            }
        }

        this.element = input;
    }

    resizeFont(fontSize) {
        this.fontSize = fontSize;
        this.mark.querySelector('input').style.fontSize = `${fontSize}px`;
    }
}

class RadioInput {
    constructor(mark, fontSize, layout, page, containerRect, mode = "edit", id = null) {
        this.mark = mark;
        this.fontSize = fontSize;
        this.layout = layout;
        this.id = id || `radio-${Date.now()}`;
        this.element;
        this.type = 'radio';
        this.mode = mode;
        this.rect = mark.getBoundingClientRect();
        this.rect = { width: this.rect.width, height: this.rect.height, left: this.rect.left - containerRect.left, top: this.rect.top - containerRect.top };

        page.elements = page.elements || {};
        page.elements[this.id] = this;
        mark.setAttribute('data-id', this.id);

        this.options = [ "Option 1", "Option 2", "Option 3" ];
    }

    prepareData() {
        if(this.mode === 'edit') {
            return {
                type: this.type,
                fontSize: this.fontSize,
                layout: this.layout,
                rect: this.rect,
                options: this.options
            }
        }
    }

    render() {
        this.mark.innerHTML = '';
        let container = document.createElement('div');
        container.className = this.layout === 'horizontal' ? 'flex items-center gap-2 flex-wrap' : 'flex flex-col';
        container.style.fontSize = `${this.fontSize}px`;

        for(let i = 0; i < this.options.length; i++) {
            let div = document.createElement('div');
            div.className = 'flex items-center gap-2';

            let label = document.createElement('label');
            label.className = 'flex items-center gap-1';
            let radio = document.createElement('input');
            radio.type = 'radio';
            radio.className = 'radio radio-primary';
            radio.name = `radio-group-${Date.now()}`;
            let span = document.createElement('span');
            span.innerText = this.options[i];

            if(this.mode === 'edit') {
                span.contentEditable = true;
                span.classList.add('border', 'border-slate-300', 'rounded', 'px-1');
                span.oninput = (e) => {
                    this.options[i] = e.target.innerText;
                }
            }

            label.appendChild(radio);
            
            if(this.mode === 'edit') {
                div.appendChild(label);
                div.appendChild(span);
                container.appendChild(div);
            } else {
                label.appendChild(span);
                container.appendChild(label);
            }
        }
        
        let button = document.createElement('button');
        button.className = 'btn btn-sm btn-outline mt-2';
        button.innerText = 'Add Option';
        button.onclick = () => {
            this.addOption();
        }

        container.appendChild(button);

        this.mark.appendChild(container);
        this.element = container;
    }

    resizeFont(fontSize) {
        this.fontSize = fontSize;
        this.element.style.fontSize = `${fontSize}px`;
    }

    changeLayout(layout) {
        this.layout = layout;
        this.element.className = layout === 'horizontal' ? 'flex items-center gap-2 flex-wrap' : 'flex flex-col';   
    }

    addOption() {
        let num = this.element.children.length;
        let div = document.createElement('div');
        div.className = 'flex items-center gap-2';
        let label = document.createElement('label');
        label.className = 'flex items-center gap-1';
        let radio = document.createElement('input');
        radio.type = 'radio';
        radio.className = 'radio radio-primary';
        radio.name = `radio-group-${Date.now()}`;
        let span = document.createElement('span');
        span.innerText = `Option ${num}`;
        if(this.mode === 'edit') {
            span.contentEditable = true;
            span.classList.add('border', 'border-slate-300', 'rounded', 'px-1');
            span.oninput = (e) => {
                this.options.push(e.target.innerText);
            }
        }
        label.appendChild(radio);

        this.options.push(`Option ${num}`);
        
        if(this.mode === 'edit') {
            div.appendChild(label);
            div.appendChild(span);
            this.element.insertBefore(div, this.element.lastChild);
        } else {
            label.appendChild(span);
            this.element.insertBefore(label, this.element.lastChild);
        }
    }
}

class CheckboxInput {
    constructor(mark, fontSize, layout, page, containerRect, mode = "edit", id = null) {
        this.mark = mark;
        this.fontSize = fontSize;
        this.layout = layout;
        this.id = id || `checkbox-${Date.now()}`;
        this.element;
        this.type = 'checkbox';
        this.mode = mode;
        this.rect = mark.getBoundingClientRect();
        this.rect = { width: this.rect.width, height: this.rect.height, left: this.rect.left - containerRect.left, top: this.rect.top - containerRect.top };
        page.elements = page.elements || {};
        page.elements[this.id] = this;
        this.options = [ "Option 1", "Option 2", "Option 3" ];
        
        mark.setAttribute('data-id', this.id);
    }

    prepareData() {
        if(this.mode === 'edit') {
            return {
                type: this.type,
                fontSize: this.fontSize,
                layout: this.layout,
                rect: this.rect,
                options: this.options
            }
        }
    }

    render() {
        this.mark.innerHTML = '';
        let container = document.createElement('div');
        container.className = this.layout === 'horizontal' ? 'flex items-center gap-2 flex-wrap' : 'flex flex-col';
        container.style.fontSize = `${this.fontSize}px`;
        for(let i = 0; i < this.options.length; i++) {
            let div = document.createElement('div');
            div.className = 'flex items-center gap-2';
            let label = document.createElement('label');
            label.className = 'flex items-center gap-1';
            let checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'checkbox checkbox-primary';
            let span = document.createElement('span');
            span.innerText = this.options[i];
            if(this.mode === 'edit') {
                span.contentEditable = true;
                span.classList.add('border', 'border-slate-300', 'rounded', 'px-1');
                span.oninput = (e) => {
                    this.options[i] = e.target.innerText;
                }
            }
            label.appendChild(checkbox);
            
            if(this.mode === 'edit') {
                div.appendChild(label);
                div.appendChild(span);
                container.appendChild(div);
            } else {
                label.appendChild(span);
                container.appendChild(label);
            }
        }

        let button = document.createElement('button');
        button.className = 'btn btn-sm btn-outline mt-2';
        button.innerText = 'Add Option';
        button.onclick = () => {
            this.addOption();
        }

        container.appendChild(button);

        this.mark.appendChild(container);
        this.element = container;
    }

    addOption() {
        let num = this.element.children.length;

        let div = document.createElement('div');
        div.className = 'flex items-center gap-2';
        let label = document.createElement('label');
        label.className = 'flex items-center gap-1';
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'checkbox checkbox-primary';
        let span = document.createElement('span');
        span.innerText = `Option ${num}`;
        if(this.mode === 'edit') {
            span.contentEditable = true;
            span.classList.add('border', 'border-slate-300', 'rounded', 'px-1');
            span.oninput = (e) => {
                this.options.push(e.target.innerText);
            }
        }
        label.appendChild(checkbox);

        this.options.push(`Option ${num}`);
        
        if(this.mode === 'edit') {
            div.appendChild(label);
            div.appendChild(span);
            this.element.insertBefore(div, this.element.lastChild);
        } else {
            label.appendChild(span);
            this.element.insertBefore(label, this.element.lastChild);
        }
    }

    resizeFont(fontSize) {
        this.fontSize = fontSize;
        this.element.style.fontSize = `${fontSize}px`;
    }

    changeLayout(layout) {
        this.layout = layout;
        this.element.className = layout === 'horizontal' ? 'flex items-center gap-2 flex-wrap' : 'flex flex-col';   
    }
}

export function exportToPdf(url, pages, callback) {
    fetch(url)
    .then(res => res.arrayBuffer())
    .then(async (data) => {
        const pdfDoc = await PDFDocument.load(data);

        for(let pageNum in pages) {
            let page = pdfDoc.getPage(parseInt(pageNum) - 1);
            let elements = pages[pageNum].elements;

            for(let id in elements) {
                let el = elements[id];
                if(el.type === 'text') {
                    page.drawText(el.value || '', {
                        x: el.rect.left,
                        y: page.getHeight() - el.rect.top - el.rect.height + (el.rect.height - el.fontSize) / 2,
                        size: el.fontSize,
                    });
                } else if(el.type === 'radio') {
                    const optionHeight = el.fontSize + 10;
                    const maxWidth = el.rect.width;
                    let cursorX = el.rect.left;
                    let cursorY = page.getHeight() - el.rect.top - optionHeight + 4;

                    el.options.forEach((option, index) => {
                        const textWidth = option.length * el.fontSize * 0.6;
                        const itemWidth = el.fontSize + 6 + textWidth; // circle + gap + text

                        if(el.layout === 'horizontal' && cursorX + itemWidth > el.rect.left + maxWidth) {
                            cursorX = el.rect.left;
                            cursorY -= optionHeight;
                        }

                        const x = cursorX;
                        const y = el.layout === 'horizontal'
                            ? cursorY
                            : page.getHeight() - el.rect.top - (index * optionHeight) - optionHeight + 4;

                        const centerX = x + el.fontSize / 2;
                        const centerY = y - 2 + el.fontSize / 2;

                        page.drawCircle({
                            x: centerX,
                            y: centerY,
                            size: el.fontSize / 2,
                            borderColor: rgb(96/255, 93/255, 255/255),
                            borderWidth: 1,
                            color: el.value === option ? rgb(0, 0, 0) : rgb(1, 1, 1),
                        });
                        page.drawCircle({
                            x: centerX,
                            y: centerY,
                            size: el.fontSize / 2 - 3.5,
                            color: el.value === option ? rgb(96/255, 93/255, 255/255) : rgb(1, 1, 1),
                        });
                        page.drawText(`${option}`, {
                            x: x + el.fontSize + 4,
                            y: y - 2,
                            size: el.fontSize,
                        });

                        if(el.layout === 'horizontal') {
                            cursorX += itemWidth + 8; // extra gap between options
                        }
                    });
                } else if(el.type === 'checkbox') {
                    const optionHeight = el.fontSize + 10;
                    const maxWidth = el.rect.width;
                    let cursorX = el.rect.left;
                    let cursorY = page.getHeight() - el.rect.top - optionHeight + 4;

                    el.options.forEach((option, index) => {
                        const textWidth = option.length * el.fontSize * 0.6;
                        const itemWidth = el.fontSize + 6 + textWidth; // box + gap + text

                        if(el.layout === 'horizontal' && cursorX + itemWidth > el.rect.left + maxWidth) {
                            cursorX = el.rect.left;
                            cursorY -= optionHeight;
                        }

                        const x = cursorX;
                        const y = el.layout === 'horizontal'
                            ? cursorY
                            : page.getHeight() - el.rect.top - (index * optionHeight) - optionHeight + 4;

                        page.drawRectangle({
                            x: x - 2,
                            y: y - 4,
                            width: el.fontSize,
                            height: el.fontSize,
                            borderColor: rgb(96/255, 93/255, 255/255),
                            borderWidth: 1,
                            color: el.value && el.value.includes(option) ? rgb(0, 0, 0) : rgb(1, 1, 1),
                        });
                        if(el.value && el.value.includes(option)) {
                            page.drawRectangle({
                                x: x + 2,
                                y: y,
                                width: el.fontSize - 8,
                                height: el.fontSize - 8,
                                color: rgb(96/255, 93/255, 255/255),
                            });
                        }
                        page.drawText(`${option}`, {
                            x: x + el.fontSize + 4,
                            y: y - 2,
                            size: el.fontSize,
                        });

                        if(el.layout === 'horizontal') {
                            cursorX += itemWidth + 8;
                        }
                    });
                }
            }
        }

        callback(await pdfDoc.save());
    });
}