"use client";
// 模板注册表：集中分发 empty/validate/publishable/Player/Editor。加新模板只改这里。
import type { ComponentType } from "react";
import { QuizPlayer, QuizEditor } from "../quiz-player";
import { validateQuizConfig, quizIsPublishable, emptyQuiz } from "../dx3xb-apps";
import { ThisOrThatPlayer, ThisOrThatEditor, totValidate, totPublishable, totEmpty } from "./thisorthat";
import { KnowMePlayer, KnowMeEditor, kmValidate, kmPublishable, kmEmpty } from "./knowme";
import { HigherLowerPlayer, HigherLowerEditor, hlValidate, hlPublishable, hlEmpty } from "./higherlower";
import { MadLibsPlayer, MadLibsEditor, mlValidate, mlPublishable, mlEmpty } from "./madlibs";
import { RiddleEscapePlayer, RiddleEscapeEditor, rdValidate, rdPublishable, rdEmpty } from "./riddle";
import type { Lang } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type PlayerC = ComponentType<{ config: any; title: string; slug?: string; lang: Lang; preview?: boolean }>;
type EditorC = ComponentType<{ config: any; onChange: (c: any) => void; lang: Lang }>;
type Reg = {
  empty: (lang?: Lang) => unknown;
  validate: (c: unknown) => unknown;
  publishable: (c: unknown) => boolean;
  Player: PlayerC;
  Editor: EditorC;
};

export const REG: Record<string, Reg> = {
  quiz: {
    empty: emptyQuiz,
    validate: validateQuizConfig,
    publishable: (c) => quizIsPublishable(validateQuizConfig(c)),
    Player: QuizPlayer as PlayerC,
    Editor: QuizEditor as EditorC,
  },
  thisorthat: {
    empty: totEmpty,
    validate: totValidate,
    publishable: (c) => totPublishable(totValidate(c)),
    Player: ThisOrThatPlayer as PlayerC,
    Editor: ThisOrThatEditor as EditorC,
  },
  knowme: {
    empty: kmEmpty,
    validate: kmValidate,
    publishable: (c) => kmPublishable(kmValidate(c)),
    Player: KnowMePlayer as PlayerC,
    Editor: KnowMeEditor as EditorC,
  },
  higherlower: {
    empty: hlEmpty,
    validate: hlValidate,
    publishable: (c) => hlPublishable(hlValidate(c)),
    Player: HigherLowerPlayer as PlayerC,
    Editor: HigherLowerEditor as EditorC,
  },
  madlibs: {
    empty: mlEmpty,
    validate: mlValidate,
    publishable: (c) => mlPublishable(mlValidate(c)),
    Player: MadLibsPlayer as PlayerC,
    Editor: MadLibsEditor as EditorC,
  },
  escape: {
    empty: rdEmpty,
    validate: rdValidate,
    publishable: (c) => rdPublishable(rdValidate(c)),
    Player: RiddleEscapePlayer as PlayerC,
    Editor: RiddleEscapeEditor as EditorC,
  },
};

export function regFor(t: string): Reg {
  return REG[t] ?? REG.quiz;
}
