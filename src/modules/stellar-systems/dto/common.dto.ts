// 스텔라 시스템 공통 타입 정의
// Star, Planet 모두에서 사용되는 공통 enum과 타입들

// 객체 타입 (항성 또는 행성)
export enum ObjectType {
  STAR = 'STAR',
  PLANET = 'PLANET',
}

// 악기 역할 (행성용)
export enum InstrumentRole {
  DRUM = 'DRUM',
  BASS = 'BASS',
  CHORD = 'CHORD',
  MELODY = 'MELODY',
  ARPEGGIO = 'ARPEGGIO',
  PAD = 'PAD',
}

// 생성 방식
export enum CreatedVia {
  MANUAL = 'MANUAL',
  CLONE = 'CLONE',
  GENERATED = 'GENERATED',
}
