import React, { useState, useEffect } from 'react';
import subjx from 'subjx';
import {
    List,
    ListItem,
    ListItemIcon,
    ListItemText
} from '@material-ui/core';
import {
    Crop32Outlined as Rectangle,
    RadioButtonUnchecked as Circle,
    GradeOutlined as Shape,
    CropOriginalOutlined as Image,
    FormatShapes as Text
} from '@material-ui/icons';

const items = [
    ['rectangle', Rectangle],
    ['circle', Circle],
    ['shape', Shape],
    ['text', Text],
    ['image', Image]
];

const EditorItems = (props) => {
    const droppables = [];
    const [isCloneable, setAsCloneable] = useState(false);

    const cloneConfig = {
        appendTo: 'body',
        stack: '#editor-background',
        style: {
            border: 'none',
            background: 'transparent',
            maxWidth: '150px',
            textColor: 'transparent'
        },
        onInit(el) {
            // console.log(el);
        },
        onDrop(e) {
            const itemType = e.target.getAttribute('data-type');
            let newItem = null;

            const editorRef = document.querySelector('#editor-background');

            const offset = editorRef.getBoundingClientRect(),
                x = e.clientX - offset.left + editorRef.scrollLeft,
                y = e.clientY - offset.top + editorRef.scrollTop;
            // console.log(offset)
            switch (itemType) {

                case 'rectangle':
                    newItem = [
                        'rect',
                        {
                            x,
                            y,
                            width: 150,
                            height: 100,
                            stroke: 'black',
                            fill: 'transparent'
                        }
                    ];
                    break;
                case 'circle':
                    newItem = [
                        'ellipse',
                        {
                            cx: x,
                            cy: y,
                            rx: 45,
                            ry: 45,       
                            stroke: 'black',
                            fill: 'transparent'
                        }
                    ];
                    break;
                case 'shape':
                    newItem = [
                        'polygon',
                        {
                            strokeWidth: "3",
                            stroke: 'black',
                            fill: "transparent",
                            strokeDasharray: "0",
                            points: "80,0 160,50 80,100 0,50"
                        },
                        []
                    ];
                    break;
                case 'image':
                    newItem = [
                        'foreignObject',
                        {
                            x: e.clientX,
                            y: e.clientY,
                            width: 150,
                            height: 100,
                            stroke: 'black',
                            fill: 'transparent'
                        },
                        []
                    ];
                    break;
                case 'text':
                    newItem = [
                        'foreignObject',
                        {
                            x: e.clientX,
                            y: e.clientY,
                            width: 150,
                            height: 100,
                            stroke: 'black',
                            fill: 'transparent'
                        },
                        []
                    ];
                    break;
                default:
                    break;

            }

            props.onDrop(
                e,
                newItem
            );
        }
    };

    useEffect(() => {
        if (isCloneable) return;
        droppables.forEach(el => subjx(el).clone(cloneConfig));
        setAsCloneable(true);
    }, [droppables, isCloneable, cloneConfig]);

    return (
        <List>
            {items.map(([text, Icon]) => (
                <ListItem
                    data-type={text}
                    ref={(el) => droppables.push(el)}
                    button
                    key={text}
                >
                    <ListItemIcon>
                        <Icon />
                    </ListItemIcon>
                    <ListItemText primary={text} />
                </ListItem>
            ))}
        </List>
    );
};

export default EditorItems;