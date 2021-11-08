﻿// (c) проект "Snegopat.Module", Александр Орефков orefkov@gmail.com
// Описание интерфейсов 1С.

:struct Font
:props
	int kind
	LOGFONT lf
	bool autoCharSet
	CompositeID style
	uint validMask
	+32

:enum FontKind
	0 fkLogfont
	1 fkSystem
	2 fkStyle
	3 fkAuto
