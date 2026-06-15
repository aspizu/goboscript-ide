import type {useMonaco} from "@monaco-editor/react"
import {languages} from "monaco-editor"

const languageConfiguration: languages.LanguageConfiguration = {
    brackets: [
        ["{", "}"],
        ["[", "]"],
        ["(", ")"]
    ],
    autoClosingPairs: [
        {open: "{", close: "}"},
        {open: "[", close: "]"},
        {open: "(", close: ")"},
        {open: '"', close: '"'}
    ],
    surroundingPairs: [
        {open: "{", close: "}"},
        {open: "[", close: "]"},
        {open: "(", close: ")"},
        {open: '"', close: '"'}
    ]
}

export function register(monaco: NonNullable<ReturnType<typeof useMonaco>>) {
    monaco.languages.register({id: "goboscript", extensions: ["gs"]})
    monaco.languages.setLanguageConfiguration("goboscript", languageConfiguration)
    monaco.languages.setMonarchTokensProvider("goboscript", {
        defaultToken: "",
        tokenPostfix: ".goboscript",

        keywords: [
            "costumes",
            "sounds",
            "global",
            "var",
            "list",
            "nowarp",
            "onflag",
            "onkey",
            "onbackdrop",
            "onloudness",
            "ontimer",
            "on",
            "onclone",
            "if",
            "else",
            "elif",
            "until",
            "forever",
            "repeat",
            "delete",
            "at",
            "add",
            "to",
            "insert",
            "true",
            "false",
            "as",
            "struct",
            "enum",
            "return",
            "error",
            "warn",
            "breakpoint",
            "local",
            "not",
            "and",
            "or",
            "in",
            "length",
            "round",
            "abs",
            "floor",
            "ceil",
            "sqrt",
            "sin",
            "cos",
            "tan",
            "asin",
            "acos",
            "atan",
            "ln",
            "log",
            "antiln",
            "antilog"
        ],

        builtins: [
            "move",
            "turn_left",
            "turn_right",
            "goto_random_position",
            "goto_mouse_pointer",
            "goto",
            "glide",
            "glide_to_random_position",
            "glide_to_mouse_pointer",
            "point_in_direction",
            "point_towards_mouse_pointer",
            "point_towards_random_direction",
            "point_towards",
            "change_x",
            "set_x",
            "change_y",
            "set_y",
            "if_on_edge_bounce",
            "set_rotation_style_left_right",
            "set_rotation_style_do_not_rotate",
            "set_rotation_style_all_around",
            "say",
            "think",
            "switch_costume",
            "next_costume",
            "switch_backdrop",
            "previous_backdrop",
            "random_backdrop",
            "next_backdrop",
            "set_size",
            "change_size",
            "change_color_effect",
            "change_fisheye_effect",
            "change_whirl_effect",
            "change_pixelate_effect",
            "change_mosaic_effect",
            "change_brightness_effect",
            "change_ghost_effect",
            "set_color_effect",
            "set_fisheye_effect",
            "set_whirl_effect",
            "set_pixelate_effect",
            "set_mosaic_effect",
            "set_brightness_effect",
            "set_ghost_effect",
            "clear_graphic_effects",
            "show",
            "hide",
            "goto_front",
            "goto_back",
            "go_forward",
            "go_backward",
            "play_sound_until_done",
            "start_sound",
            "stop_all_sounds",
            "change_pitch_effect",
            "change_pan_effect",
            "set_pitch_effect",
            "set_pan_effect",
            "change_volume",
            "set_volume",
            "clear_sound_effects",
            "broadcast",
            "broadcast_and_wait",
            "wait",
            "stop_all",
            "stop_this_script",
            "stop_other_scripts",
            "delete_this_clone",
            "clone",
            "ask",
            "set_drag_mode_draggable",
            "set_drag_mode_not_draggable",
            "reset_timer",
            "erase_all",
            "stamp",
            "pen_down",
            "pen_up",
            "set_pen_color",
            "change_pen_size",
            "set_pen_size",
            "set_pen_hue",
            "set_pen_saturation",
            "set_pen_brightness",
            "set_pen_transparency",
            "change_pen_hue",
            "change_pen_saturation",
            "change_pen_brightness",
            "change_pen_transparency",
            "rest",
            "set_tempo",
            "change_tempo"
        ],

        typeKeywords: [
            "x_position",
            "y_position",
            "direction",
            "size",
            "costume_number",
            "costume_name",
            "backdrop_number",
            "backdrop_name",
            "volume",
            "distance_to_mouse_pointer",
            "distance_to",
            "touching_mouse_pointer",
            "touching_edge",
            "touching",
            "key_pressed",
            "mouse_down",
            "mouse_x",
            "mouse_y",
            "loudness",
            "timer",
            "current_year",
            "current_month",
            "current_date",
            "current_day_of_week",
            "current_hour",
            "current_minute",
            "current_second",
            "days_since_2000",
            "username",
            "online",
            "touching_color",
            "color_is_touching_color",
            "answer",
            "random",
            "contains"
        ],

        operators: ["+", "-", "*", "/", "%", "<", ">", "=", "&", "!"],

        // The main tokenizer for our languages
        tokenizer: {
            root: [
                [/#.*$/, "comment"],
                [/^%.*$/, "keyword.directive"],

                [/"/, {token: "string.quote", bracket: "@open", next: "@string"}],

                [
                    /\b(proc|func)\b\s+([a-zA-Z_][_a-zA-Z0-9]*)/,
                    ["keyword", "entity.name.function"],
                    "@signature"
                ],
                [/[a-zA-Z_0-9]+!/, "variable.parameter"],
                [/\$[_a-zA-Z0-9]+/, "variable.parameter"],

                [
                    /\b([0-9][_0-9]*|0x[_0-9a-fA-F]+|0b[_0-1]+|0o[_0-7]+|([0-9][0-9]*)?\.[0-9][_0-9]*)\b/,
                    "number"
                ],

                [/\.[a-zA-Z_0-9][_a-zA-Z_0-9]*/, "entity.name.function"],
                [/[;,]/, "delimiter"],
                [/[+\-*/%<>=&!]/, "operator"],

                [
                    /\b\w+\b/,
                    {
                        cases: {
                            "@keywords": "keyword",
                            "@builtins": "support.function.builtin",
                            "@typeKeywords": "type",
                            "@default": "identifier"
                        }
                    }
                ]
            ],

            signature: [
                [/\{/, "@brackets", "@pop"],
                [/[a-zA-Z_][_a-zA-Z0-9]*/, "variable.parameter"],
                [/[;,]/, "delimiter"],
                [/[^a-zA-Z_;,{]+/, ""],
                [/./, ""]
            ],

            string: [
                [/[^\\"]+/, "string"],
                [/\\["\\bfnrt]/, "string.escape"],
                [/\\u[a-fA-F0-9]{4}/, "string.escape"],
                [/"/, {token: "string.quote", bracket: "@close", next: "@pop"}]
            ]
        }
    })
}
