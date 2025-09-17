import * as React from "react";

const PlayIcon: React.FC<React.SVGProps<SVGElement>> = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={props.width}
        height={props.height}
        viewBox="0 0 18 18"
    >
        <g
            id="Free-Icons"
            fill="none"
            fillRule="evenodd"
            stroke="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={props.strokeWidth}
        >
            <g
                id="Group"
                stroke="currentColor"
                strokeWidth={props.strokeWidth}
                transform="translate(-749 -379)"
            >
                <path
                    id="Shape"
                    d="M5 4.678a.63.63 0 0 1 .094-.33c.2-.326.654-.444 1.015-.263l14.507 7.322a.7.7 0 0 1 .29.264c.2.327.07.74-.29.922L6.109 19.915a.8.8 0 0 1-.363.085C5.334 20 5 19.696 5 19.322z"
                    transform="translate(745 376)"
                ></path>
            </g>
        </g>
    </svg>
);

const PauseIcon: React.FC<React.SVGProps<SVGElement>> = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={props.width}
        height={props.height}
        viewBox="-1 0 20 20"
    >
        <g
            id="Free-Icons"
            fill="none"
            fillRule="evenodd"
            stroke="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={props.strokeWidth}
        >
            <g
                id="Group"
                stroke="currentColor"
                strokeWidth={props.strokeWidth}
                transform="translate(-896 -378)"
            >
                <g id="Shape">
                    <path d="M898.778 397c-.982 0-1.778-.995-1.778-2.222v-13.556c0-1.227.796-2.222 1.778-2.222h2.444c.982 0 1.778.995 1.778 2.222v13.556c0 1.227-.796 2.222-1.778 2.222zM907 381.222c0-1.227.796-2.222 1.778-2.222h2.444c.982 0 1.778.995 1.778 2.222v13.556c0 1.227-.796 2.222-1.778 2.222h-2.444c-.982 0-1.778-.995-1.778-2.222z"></path>
                </g>
            </g>
        </g>
    </svg>
);

const StopIcon: React.FC<React.SVGProps<SVGElement>> = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={props.width}
        height={props.height}
        viewBox="0 0 20 20"
    >
        <g
            id="Free-Icons"
            fill="none"
            fillRule="evenodd"
            stroke="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={props.strokeWidth}
        >
            <g
                id="Group"
                stroke="currentColor"
                strokeWidth={props.strokeWidth}
                transform="translate(-1043 -378)"
            >
                <path
                    id="Shape"
                    d="M5.571 21A2.57 2.57 0 0 1 3 18.429V5.57A2.57 2.57 0 0 1 5.571 3H18.43A2.57 2.57 0 0 1 21 5.571V18.43A2.57 2.57 0 0 1 18.429 21z"
                    transform="translate(1041 376)"
                ></path>
            </g>
        </g>
    </svg>
);

const RecordIcon: React.FC<React.SVGProps<SVGElement>> = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={props.width}
        height={props.height}
        fill="none"
        viewBox="-0.5 0 25 25"
    >
        <path
            id="SVGRepo_iconCarrier"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={props.strokeWidth}
            d="M12 21.67a9.25 9.25 0 1 0 0-18.5 9.25 9.25 0 0 0 0 18.5"
        ></path>
    </svg>
);

export { PlayIcon, PauseIcon, StopIcon, RecordIcon }
