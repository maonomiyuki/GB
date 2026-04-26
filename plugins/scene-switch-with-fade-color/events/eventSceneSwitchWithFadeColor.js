const id = "EVENT_SWITCH_SCENE_WITH_FADE_COLOR";
const groups = ["EVENT_GROUP_SCENE"];

const autoLabel = (fetchArg) => {
  return `Switch to ${fetchArg("sceneId")} (${fetchArg("fadeColor")})`;
};

const fields = [
  {
    key: "sceneId",
    label: "移動先シーン",
    type: "scene",
    defaultValue: "LAST_SCENE",
  },
  {
    type: "group",
    wrapItems: true,
    fields: [
      {
        key: "x",
        label: "移動先X座標",
        type: "value",
        min: 0,
        max: 255,
        width: "50%",
        defaultValue: {
          type: "number",
          value: 0,
        },
      },
      {
        key: "y",
        label: "移動先Y座標",
        type: "value",
        min: 0,
        max: 255,
        width: "50%",
        defaultValue: {
          type: "number",
          value: 0,
        },
      },
    ],
  },
  {
    key: "direction",
    label: "プレイヤーの向き",
    type: "direction",
    defaultValue: "",
    width: "50%",
  },
  {
    key: "fadeColor",
    label: "フェード色",
    type: "select",
    options: [
      ["white", "White"],
      ["black", "Black"],
    ],
    defaultValue: "white",
    width: "50%",
  },
  {
    key: "fadeSpeed",
    label: "フェード速度",
    type: "select",
    options: [
      ["default", "Default"],
      ["fast", "Fast"],
      ["slow", "Slow"],
    ],
    defaultValue: "default",
    width: "50%",
  },
];

const FADE_SPEED_MAP = {
  default: "2",
  fast: "1",
  slow: "3",
};

const FADE_COLOR_ENGINE_VALUE_MAP = {
  white: 0,
  black: 1,
};

const compile = (input, helpers) => {
  const { engineFieldSetToScriptValue, sceneSwitchUsingScriptValues } = helpers;

  const fadeStyle =
    FADE_COLOR_ENGINE_VALUE_MAP[input.fadeColor] !== undefined
      ? FADE_COLOR_ENGINE_VALUE_MAP[input.fadeColor]
      : FADE_COLOR_ENGINE_VALUE_MAP.white;

  // Built-in engine field used by GB Studio for scene transition color.
  // 0 = white fade, 1 = black fade.
  engineFieldSetToScriptValue("fade_style", {
    type: "number",
    value: fadeStyle,
  });

  const fadeSpeed = FADE_SPEED_MAP[input.fadeSpeed] ?? FADE_SPEED_MAP.default;

  sceneSwitchUsingScriptValues(
    input.sceneId,
    input.x,
    input.y,
    input.direction,
    fadeSpeed,
  );
};

module.exports = {
  id,
  name: "Scene: Switch With Fade Color",
  description: "シーン切り替え時に白/黒フェード色を指定",
  groups,
  autoLabel,
  fields,
  compile,
};
