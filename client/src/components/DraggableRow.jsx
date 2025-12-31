import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const DraggableRow = ({ id, children, ...props }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: isDragging ? 'var(--color-bg-secondary)' : 'transparent',
    };

    // Create a drag handle cell
    const childrenArray = Array.isArray(children) ? children : [children];
    const newChildren = [
        <td key="drag-handle" style={{ width: '30px', cursor: 'grab', textAlign: 'center' }} {...attributes} {...listeners}>
            ☰
        </td>,
        ...childrenArray
    ];

    return (
        <tr ref={setNodeRef} style={style} {...props}>
            {newChildren}
        </tr>
    );
};
