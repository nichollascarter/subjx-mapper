import { TrackProp } from '../../ui/helpers';
import { UndoState } from '../../classes';

const transformProperties = [
    { property: 'translateX', name: 'Translate X', type: 'number' },
    { property: 'translateY', name: 'Translate Y', type: 'number' },
    { property: 'scaleX', name: 'Scale X', type: 'number' },
    { property: 'scaleY', name: 'Scale Y', type: 'number' },
    { property: 'rotate', name: 'Rotate', type: 'number' },
    { property: 'opacity', name: 'Opacity', type: 'number' },
    { property: 'width', name: 'Width', type: 'number' },
    { property: 'height', name: 'Height', type: 'number' },
    { property: 'color', name: 'Color', type: 'number' }
];

class TransformMenu {

    dom = document.createElement('div');
    listDom = document.createElement('div');
    tracks = [];

    constructor(data, dispatcher, undoStack) {
        const { dom, listDom } = this;

        dom.classList.add('dropdown');
        dom.classList.add('tml-panel-operation-button');
        listDom.classList.add('dropdown-content');

        transformProperties.map(({ property, name }) => {
            const contentItem = document.createElement('a');
            contentItem.setAttribute('data-value', property);
            contentItem.textContent = name;
            listDom.appendChild(contentItem);
        });

        listDom.addEventListener('click', (e) => {
            const name = e.target.getAttribute('data-value');

            const track = new TrackProp(name);
            this.tracks.value.push(track);

            undoStack.save(new UndoState(data, 'Layer added'));
            dispatcher.fire('action:state', null, e.pressed);
        });

        dom.appendChild(listDom);
        document.body.appendChild(dom);
    }

    setState(state) {
        this.tracks = state.get('tracks');
    }

}

export { TransformMenu };
