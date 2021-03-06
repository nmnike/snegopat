REX
===================================================================================================

> - Видишь суслика?
> - Нет.
> - И я не вижу. А он - есть.
> (с) ДМБ

Для работы с юникодом V8 использует кроссплатформенную библиотеку ICU, которая помимо прочего,
содержит и функционал по работе с регулярными выражениями. По какой-то неизвестной причине, 1С не "вытащила"
этот функционал "наружу", и пользоваться им из языка 1С возможности нет.

Однако, как всегда, на помощь приходят ВК.

Представляю свою разработку, которая строит "мостик" из библиотеки ICU в язык 1С.
Она может работать и как Native ВК, и как аддин к Снегопату.

Разработка выполнена по технологии "real native", т.е. не просто нативная по терминологии 1С, а использует
"родные" методы движка 1С и притворяется штатным объектом 1С. (В семерке так работали 1С++, Rainbow и пр.)

Работа проверялась в толстом и тонком клиенте, и на серверах 32 и 64 бит.
Поддерживаются релизы 8.2, 8.3.

Для работы в релизах 8.2 младше 14ого, необходимо скопировать в папку `bin` файлы `icuXXX46.dll` из каталогов
`bin` более старших релизов 1С.

Подробнее о регулярных выражениях в ICU можно посмотреть [здесь](http://userguide.icu-project.org/strings/regexp).
Если сравнивать их с обычно используемыми `VBScript.RegExp` - регулярки от ICU более мощные, правильные,
и всегда есть вместе с 1С.

В поставку входит два файла:

  - rex32.dll - для работы в 32-битных клиентах
  - rex64.dll - для работы в 64-битном сервере

## Подключение компоненты

Компонента загружается так:

В 1С-Предприятии:

	ПодключитьВнешнююКомпоненту("путь\rexXX.dll", "RegEx", ТипВнешнейКомпоненты.Native);

В Снегопате подключается как аддин - dll. Впишите в addins.ini строку

	dll:путь к rex32.dll

## Объект V8RegEx
Представляет регулярное выражение и служит для применения подготовленного регулярного выражения.
Сначала объекту либо через конструктор, либо через свойство `Шаблон` задается регулярное выражения,
затем с помощью различных методов это выражение может неоднократно применятся к различным текстам.

### Создание объекта для работы
После подключения компоненты можно создавать объекты для работы.

В 1С-Предприятии это делается так:

	ре = Новый("V8RegEx", [Шаблон]);

Параметры:

  - [Шаблон] - необязательный параметр, массив с одним элементом - строкой регулярного выражения.

		Шаблон = Новый Массив(1);
		Шаблон[0] = "регулярное выражение";

В Снегопате объект создается через v8New:

	re = v8New("V8RegEx", [Шаблон]);

Параметры:

  - [Шаблон] - необязательный параметр, Строка, регулярное выражение.

### Свойство Шаблон / Pattern
Чтение и запись. Строка. Содержит регулярное выражение.

При присвоении свойства компонента проверяет и компилирует регулярное выражение.
В случае ошибки компиляции генерируется исключение с описанием ошибки.
Компонента внутри ведет кэш регулярных выражений, поэтому присвоении недавно использовавшихся
шаблонов не приведет к их повторной компиляции.

### Методы Совпадает, Начинается, Содержит, Найти
Это группа методов для анализа текста регулярным выражением. Их английские названия соответственно
Matches, LookingAt, Contain, Find.

  - `Совпадает / Matches` - проверяет строку на полное совпадение с регулярным выражением.
  - `Начинается / LookingAt` - проверяет, что начало строки совпадает с регулярным выражением.
  - `Содержит / Contain` - проверяет, что часть строки совпадает с регулярным выражением.
  - `Найти / Find` - находит в строке все совпадения с регулярным выражением.

**Синтаксис:**

	результат = объект.ИмяМетода(Текст, [НачальныйИндекс])

**Параметры:**

  - Текст. Строка. Обязательный параметр. Содержит анализиремый текст.
  - [НачальныйИндекс]. Число. Необязательный параметр. По-умолчанию 0.
    Содержит стартовую позицию, начиная с которой надо анализировать текст.
	Нумерация позиций в отличии от 1С начинается с **0**.

**Возвращают:**

Если анализ успешен, возвращают объект `ДеревоЗначений`, содержащий три колонки:

  - Текст / Value. Текст совпадения.
  - Начало / FirstIndex. Начальная позиция совпадения в исходной строке.
  - Длина / Length. Длина совпадения.

Строки первого уровня дерева значений содержат информацию о всём совпадении,
подстроки каждой строки содержат информацию о захваченных группах.

### Метод Разделить / Split
Разделяет исходную строку на части, используя как разделитель заданное регулярное выражение.

**Синтаксис:**

	результат = объект.Разделить(ИсходнаяСтрока);

**Параметры:**

  - ИсходнаяСтрока. Строка. Текст, котором необходимо разбить на части.

**Возвращает:** объект Массив. Содержит получившиеся строки.

### Метод Заменить / Replace
Заменяет в исходной строке все вхождения регулярного выражения на СтрокаЗамены.

**Синтаксис:**

	результат = объект.Заменить(ИсходнаяСтрока, СтрокаЗамены);

**Параметры:**

  - ИсходнаяСтрока. Строка. Текст, в котором необходимо выполнить замены.
  - СтрокаЗамены. Строка. Текст, который будет вставляться в места замены.

**Возвращает:** результирующую строку.

В строке замены можно использовать ссылки на захваченные группы, как $n, где n - номер
захваченной группы ($0 - все захваченное выражение).

### Совместимость с VBScript.Regexp
Для упрощения перехода на новую компоненту, объект также поддерживает такой-же интерфейс,
как и объект VBScript.Regexp. Это методы Exec, Test, а также свойства Multiline, Global, IgnoreCase.

### Метод Test / Проверить
Проверяет строку на вхождение регулярного совпадения.

**Синтаксис:**

	результат = объект.Test(ПроверяемыйТекст);

**Параметры:**

  - ПроверяемыйТекст. Строка. Текст для проверки.

**Возвращает:** Булево. Истина, если текст содержит вхожение, иначе Ложь.
По действию аналогичен методу Содержит, но не возвращает информацию о вхождении.

### Метод Execute / Выполнить
Находит в исходной строке совпадения с регулярным выражением.

**Синтаксис:**

	результат = объект.Execute(ПроверяемыйТекст);

**Параметры:**

  - ПроверяемыйТекст. Строка. Текст для проверки.

**Возвращает:** Объект RegExMatches. Объект совместим по интерфейсу с результатом
выполнения метода Execute объектом VBScript.Regexp. Поддерживает как обход "Для Каждого",
так и доступ методом Item(Индекс). Содержит свойство Count и метод Count(), так как
исходный объект так же поддерживает это свойство и метод.

Если свойство Global установлено в Истина, находит все вхождения, иначе - только первое.

### Свойство Global / Глобальный
Чтение и запись. Булево.
Влияет на метод Execute и Replace.
При установке в Истина метод будет искать либо заменять все вхождения, иначе только первое.

### Свойство Multilie / Многострочный
Чтение и запись. Булево.
Влияет на все методы. При установке в Истина в начало регулярного выражения добавляется флаг (?m).

### Свойство IgnoreCase / НеУчитыватьРегистр
Чтение и запись. Булево.
Влияет на все методы. При установке в Истина в начало регулярного выражения добавляется флаг (?i).

## Объект RegExMatches
Служит для возращения результата методом Execute, для совместимости с интерфейсом результата
этого метода в VBScript.Regexp.

Представляет из себя коллекцию объектов `RegExMatch`, поддерживает обход `Для Каждого` и
доступ к любому элементу через его индекс оператором `[]` (нумерация с 0).

### Свойство Count / Количество
Только чтение. Число. Содержит количество элементов в коллекции.

### Метод Count / Количество.
Возвращает количество элементов в коллекции.

**Синтаксис:**

	к = результат.Количество();

**Возвращает:** Число. Количество элементов в коллекции.

Коллекция имеет и метод, и свойство Count для совместимости со старым кодом.

### Метод Item / Получить
Служит для получения элемента коллекции по его индексу.

**Синтаксис:**

	элемент = результат.Item(Индекс);

**Параметры:**

  - Индекс. Число. Номер элемента в коллекции, начиная с 0.

**Возвращает:** объект RegExMatch, элемент коллекции.

## Объект RegExMatch
Представляет один из результатов применения регулярного выражения методом Execute.

### Свойство Value / Текст
Только чтение. Строка. Содержит текст всего совпадения с регулярным выражением.

### Свойство FirstIndex / Начало
Только чтение. Число. Содержит позицию начала совпадения в исходном тексте.
Нумерация позиций начинается с 0.

### Свойство Length / Длина
Только чтение. Число. Содержит длину совпадения.

### Свойство SubMatches / Подгруппы
Только чтение. Объект RegExSubMatches, коллекция строк - захваченных групп.

## Объект RegExSubMatches
Содержит коллекцию строк - захваченных групп регулярного выражения.
Поддерживает обход `Для Каждого` и доступ к любому элементу через его индекс
оператором `[]` (нумерация с 0).

### Свойство Count / Количество
Только чтение. Число. Содержит количество элементов в коллекции.

### Метод Count / Количество.
Возвращает количество элементов в коллекции.

**Синтаксис:**

	к = результат.Количество();

**Возвращает:** Число. Количество элементов в коллекции.

Коллекция имеет и метод, и свойство Count для совместимости со старым кодом.

### Метод Item / Получить
Служит для получения элемента коллекции по его индексу.

**Синтаксис:**

	элемент = результат.Item(Индекс);

**Параметры:**

  - Индекс. Число. Номер элемента в коллекции, начиная с 0.

**Возвращает:** Строка, элемент коллекции, текст захваченной группы.
