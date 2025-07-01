import * as React from "react";

const UndoIcon: React.FC<React.SVGProps<SVGElement>> = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={props.width}
        height={props.height}
        fill="none"
        stroke={props.stroke}
        strokeLinecap="round"
        viewBox="0 0 24 24"
    >
        <path d="M3 9h18v11h-9"></path>
        <path d="M8 4 3 9l5 5"></path>
    </svg>
);

const RedoIcon: React.FC<React.SVGProps<SVGElement>> = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={props.width}
        height={props.height}
        fill="none"
        stroke={props.stroke}
        strokeLinecap="round"
        transform="scale(-1 1)"
        viewBox="0 0 24 24"
    >
        <g id="SVGRepo_iconCarrier">
            <path d="M3 9h18v11h-9"></path>
            <path d="M8 4 3 9l5 5"></path>
        </g>
    </svg>
);

export { UndoIcon, RedoIcon }
