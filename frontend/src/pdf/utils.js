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

let elements = {};

class BalloonEditor {
    constructor(container) {
        this.container = container;
    }

    show(x, y, mark, mode = "edit", create = true) {
        this.container.style.left = Math.max(0, x - this.container.offsetWidth / 2) + 'px';
        this.container.style.top = (y - 10 - this.container.offsetHeight) + 'px';
        this.container.style.visibility = 'visible';
        this.container.style.opacity = 1;

        let t;

        if(create) {
            this.container.querySelector('#type-selector').value = 'text';
            this.container.querySelector('#font-size').value = 20;
            this.container.querySelectorAll('.layout-btns').forEach(btn => btn.style.display = 'none');
            this.container.querySelector('.layout-btns').previousElementSibling.style.display = 'none';
            t = new TextInput(mark, 20, mode);
            t.render();
        } else {
            t = elements[mark.getAttribute('data-id')];
            this.container.querySelector('#type-selector').value = t.type;
            this.container.querySelector('#font-size').value = t.fontSize;

            if(t.type === 'text') {
                this.container.querySelectorAll('.layout-btns').forEach(btn => btn.style.display = 'none');
                this.container.querySelector('.layout-btns').previousElementSibling.style.display = 'none';
            } else if(t.type === 'radio' || t.type === 'checkbox') {
                this.container.querySelectorAll('.layout-btns').forEach(btn => btn.style.display = 'flex');
                this.container.querySelector('.layout-btns').previousElementSibling.style.display = 'flex';
            }
        }

        this.container.querySelector('#font-size').oninput = (e) => {
            t.resizeFont(parseInt(e.target.value));
        }

        this.container.querySelector("#delete-btn").onclick = () => {
            mark.remove();
            delete elements[t.id];
            this.hide();
        }

        this.container.querySelector('#type-selector').onchange = (e) => {
            if(e.target.value === 'text') {
                let newText = new TextInput(mark, parseInt(this.container.querySelector('#font-size').value), mode, t.id);
                newText.render();
                elements[t.id] = newText;
                this.container.querySelectorAll('.layout-btns').forEach(btn => btn.style.display = 'none');
                this.container.querySelector('.layout-btns').previousElementSibling.style.display = 'none';
            } else if(e.target.value === 'radio') {
                let newRadio = new RadioInput(mark, parseInt(this.container.querySelector('#font-size').value), 'vertical', mode, t.id);
                newRadio.render();
                elements[t.id] = newRadio;
                this.container.querySelectorAll('.layout-btns').forEach(btn => btn.style.display = 'flex');
                this.container.querySelector('.layout-btns').previousElementSibling.style.display = 'flex';

                this.container.querySelector('#vertical-layout-btn').onclick = () => {
                    newRadio.changeLayout('vertical');
                }

                this.container.querySelector('#horizontal-layout-btn').onclick = () => {
                    newRadio.changeLayout('horizontal');
                }
            } else if(e.target.value === 'checkbox') {
                let newCheckbox = new CheckboxInput(mark, parseInt(this.container.querySelector('#font-size').value), 'vertical', mode, t.id);
                newCheckbox.render();
                elements[t.id] = newCheckbox;
                this.container.querySelectorAll('.layout-btns').forEach(btn => btn.style.display = 'flex');
                this.container.querySelector('.layout-btns').previousElementSibling.style.display = 'flex';

                this.container.querySelector('#vertical-layout-btn').onclick = () => {
                    newCheckbox.changeLayout('vertical');
                }

                this.container.querySelector('#horizontal-layout-btn').onclick = () => {
                    newCheckbox.changeLayout('horizontal');
                }
            }

            t = elements[t.id];
        }
    }

    hide() {
       this.container.style.opacity = 0;
       this.container.style.visibility = 'hidden';
    }

    get visible() {
       return this.container.style.visibility === 'visible';
    }

    isTarget(e) {
        let rect = this.container.getBoundingClientRect();
        return e.clientX >= rect.left &&
                e.clientX <= rect.left + rect.width &&
                e.clientY >= rect.top &&
                e.clientY <= rect.top + rect.height;
    }
}

export const balloonEditor = (container) => new BalloonEditor(container);

class TextInput {
    constructor(mark, fontSize, mode = "edit", id = null) {
        this.mark = mark;
        this.fontSize = fontSize;
        this.id = id || `text-${Date.now()}`;
        this.element;
        this.mode = mode;
        this.type = 'text';

        elements[this.id] = this;
        mark.setAttribute('data-id', this.id);
    }

    render() {
        this.mark.innerHTML = '';

        let input = document.createElement('input');
        input.type = 'text';
        input.className = 'border border-slate-300 rounded px-2 py-1';
        input.placeholder = 'Enter text';
        input.style.width = this.mark.style.width;
        input.style.height = this.mark.style.height;
        input.style.fontSize = `${this.fontSize}px`;
        this.mark.appendChild(input);
        input.focus();

        input.onchange = (e) => {
            if(this.mode === 'edit') {
                input.placeholder = e.target.value;
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
    constructor(mark, fontSize, layout, mode = "edit", id = null) {
        this.mark = mark;
        this.fontSize = fontSize;
        this.layout = layout;
        this.id = id || `radio-${Date.now()}`;
        this.element;
        this.type = 'radio';
        this.mode = mode;

        elements[this.id] = this;
        mark.setAttribute('data-id', this.id);
    }

    get tools() {
        return [ {
            id: "layout",
            icon: ""
        } ];
    }

    render() {
        this.mark.innerHTML = '';
        let container = document.createElement('div');
        container.className = this.layout === 'horizontal' ? 'flex items-center gap-2 flex-wrap' : 'flex flex-col';
        container.style.fontSize = `${this.fontSize}px`;

        for(let i = 0; i < 3; i++) {
            let div = document.createElement('div');
            div.className = 'flex items-center gap-2';

            let label = document.createElement('label');
            label.className = 'flex items-center gap-1';
            let radio = document.createElement('input');
            radio.type = 'radio';
            radio.className = 'radio radio-primary';
            radio.name = `radio-group-${Date.now()}`;
            let span = document.createElement('span');
            span.innerText = `Option ${i + 1}`;

            if(this.mode === 'edit') {
                span.contentEditable = true;
                span.classList.add('border', 'border-slate-300', 'rounded', 'px-1');
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
        }
        label.appendChild(radio);
        
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
    constructor(mark, fontSize, layout, mode = "edit", id = null) {
        this.mark = mark;
        this.fontSize = fontSize;
        this.layout = layout;
        this.id = id || `checkbox-${Date.now()}`;
        this.element;
        this.type = 'checkbox';
        this.mode = mode;
        elements[this.id] = this;
        mark.setAttribute('data-id', this.id);
    }

    render() {
        this.mark.innerHTML = '';
        let container = document.createElement('div');
        container.className = this.layout === 'horizontal' ? 'flex items-center gap-2 flex-wrap' : 'flex flex-col';
        container.style.fontSize = `${this.fontSize}px`;
        for(let i = 0; i < 3; i++) {
            let div = document.createElement('div');
            div.className = 'flex items-center gap-2';
            let label = document.createElement('label');
            label.className = 'flex items-center gap-1';
            let checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'checkbox checkbox-primary';
            let span = document.createElement('span');
            span.innerText = `Option ${i + 1}`;
            if(this.mode === 'edit') {
                span.contentEditable = true;
                span.classList.add('border', 'border-slate-300', 'rounded', 'px-1');
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
        }
        label.appendChild(checkbox);
        
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