﻿//engine: JScript
//uname: bsl_analyze
//dname: Расширенный анализ модулей
//descr: Скрипт для взаимодействия с bsl language server
//author: orefkov
//help: inplace
//addin: global
exports.__esModule = true;
/// <reference path="./snegopat.d.ts" />
/// <reference path="./v8.d.ts" />
/*@
Данный скрипт осуществляет анализ текстов модулей с помощью bsl language server и выводит
результат диагностики в форму, позволяя быстро перейти к нужному месту.

Выполняется проверка текущего редактируемого модуля.
Если в модуле выделено более одной строки - отображается результат проверки только для выделенных строк.
Это позволяет отображать ошибки только по тем строкам, которые были изменены в рамках текущей задачи.

Необходимо что бы была включена "Работа при наборе текста". См. настройки Снегопата.
@*/
var stdlib = require("./std/std");
var stdcommands = require("./std/commands");
global.connectGlobals(SelfScript);
// Метод вызывается при регистрации хоткеев аддина
function getPredefinedHotkeys(predef) {
    predef.setVersion(1);
    stdlib.getAllPredefHotKeys(SelfScript.self, predef);
}
var form;
var formSettings;
var lastResult;
var parsedTextWindow;
var mdCont;
var mdObjId;
var mdPropId;
var filePath;
var lastView;
var lastSelection;
var pathToBslServer;
var pathToBslJson;
var pathToTemp;
var pflFolder = "Snegopat/bsl_analize/";
var pflPathToBslServer = pflFolder + "pathToBsl";
var pflPathToBslJson    = pflFolder + "pathToBslJson";
var pflPathToBslTemp   = pflFolder + "pathToTemp";
function tryFindPathToBsl(p) {
    if (v8New("File", p).Exist()) {
        pathToBslServer = p;
        return true;
    }
    return false;
}
function storeSettings() {
    profileRoot.setValue(pflPathToBslServer, pathToBslServer);
    profileRoot.setValue(pflPathToBslJson,    pathToBslJson);
    profileRoot.setValue(pflPathToBslTemp,   pathToTemp);
}
(function () {
    // Укажем, что сохранять настройки надо в файле настроек снегопата
    profileRoot.createValue(pflPathToBslServer, "", pflSnegopat);
    pathToBslServer = profileRoot.getValue(pflPathToBslServer);
    if (!pathToBslServer) {
        if (!tryFindPathToBsl("c:\\Program Files\\bsl-language-server\\bsl-language-server.exe"))
            tryFindPathToBsl("c:\\Program Files\\phoenixbsl\\app\\bsl-language-server\\bsl-language-server.exe");
        if (!!pathToBslServer)
            storeSettings();
    }
    profileRoot.createValue(pflPathToBslJson, "", pflSnegopat);
    pathToBslJson = profileRoot.getValue(pflPathToBslJson);
    profileRoot.createValue(pflPathToBslTemp, "", pflSnegopat);
    pathToTemp = profileRoot.getValue(pflPathToBslTemp);
    if (!pathToTemp) {
        pathToTemp = TempFilesDir()
    }    
})();
function runAnalyses(td) {
    try {
        var tempFileName = GetTempFileName();
        var tempDirName = v8New("File", tempFileName).BaseName;
        var tmpPath = pathToTemp + tempDirName + "\\";
        CreateDirectory(tmpPath);
        var fPath = tmpPath + "text.bsl";
        
        var text = td.GetText();
        var text = text.replace(/\r/g, "");
        td1 = v8New("TextDocument");
        td1.setText(text);
        td1.Write(fPath);

        if (!v8New("File", fPath).Exist()) {
            MessageBox("Не удалось записать текст модуля во временный файл");
            return undefined;
        }
        if (pathToBslJson)
            var key_c = ' -c "' + pathToBslJson + '"'
        else
            var key_c = '';    
        var wsh = new ActiveXObject("Wscript.Shell");
        var escPath = tmpPath.replace(/\\/g, "\\\\");
        var cmd = '"' + pathToBslServer + '" -a -s "' + escPath + '" -w "' + escPath + '" -o "' + escPath + '" -r json' + key_c;
        wsh.Run(cmd, 1, 1);
        fPath = tmpPath + "bsl-json.json";
        if (!v8New("File", fPath).Exist()) {
            MessageBox("Файл с результатом работы не найден " + fPath);
            MessageBox("cmd: " + cmd);
            return undefined;
        }
        td = v8New("TextDocument");
        td.Read(fPath, TextEncoding.UTF8);
        DeleteFiles(tmpPath);
        return JSON.parse(td.GetText());
    }
    catch (e) {
        Message(e.description);
    }
    return undefined;
}
function storeCurrentWindow(tw) {
    lastView = windows.getActiveView();
    parsedTextWindow = tw;
    filePath = tw.textDocument.UsedFileName;
    if (tw.mdCont) {
        mdCont = tw.mdCont;
        mdObjId = tw.mdObj.id;
        mdPropId = tw.mdProp.id;
    }
    else {
        mdCont = null;
        mdObjId = '';
        mdPropId = '';
    }
}
function loadForm() {
    if (!form)
        form = loadFormForScript(SelfScript);
}
function loadFormSettings() {
    if (!formSettings)
        formSettings = loadFormForScript(SelfScript, "Настройка");
}
function fillForm() {
    loadForm();
    form.msgList.Clear();
    form.Controls.ИмяМодуля.Caption = lastView.title;
    var diagList = lastResult["fileinfos"][0]["diagnostics"];
    for (var k in diagList) {
        var diag = diagList[k];
        var rn = diag.range;
        var nomRow = rn.start.line + 1;
        if (lastSelection.beginRow == lastSelection.endRow || (lastSelection.beginRow<=nomRow && nomRow<=lastSelection.endRow)) {
            var row = form.msgList.Add();
            row.НомерСтроки = nomRow;
            row.Позиция = rn.start.line + 1 + ":" + (rn.start.character + 1) + " - " + (rn.end.line + 1) + ":" + (rn.end.character + 1);
            row.Важность = diag.severity;
            row.Сообщение = diag.message;
            row.ВажностьЧисло = GetSeverityNumber(diag.severity);
        }
    }
    form.msgList.Сортировать("ВажностьЧисло Убыв");
}
function GetSeverityNumber(severity) {
    switch (severity) {
        case "Hint":
            return 0;
        case "Information":
            return 10;
        case "Warning":
            return 20;
        case "Error":
            return 30;
        default:
            break;
    }
    return 0;
}
function openForm() {
    loadForm();
    form.Open();
}
function openFormSettings() {
    loadFormSettings();
    formSettings.DoModal();
}
function formSettingsПриОткрытии() {
    formSettings.pathToBslServer = pathToBslServer;
    formSettings.pathToBslJson    = pathToBslJson;
    formSettings.pathToTemp      = pathToTemp;
}
function formSettingsЗаписатьИЗакрыть(Кнопка) {
    pathToBslServer = formSettings.pathToBslServer;
    pathToBslJson    = formSettings.pathToBslJson;
    pathToTemp      = formSettings.pathToTemp;
    storeSettings();
    formSettings.Close();
}
function formSettingsСкачатьbsl(Кнопка) {
    RunApp("https://github.com/1c-syntax/bsl-language-server/releases");
}
function pathToBslServerНачалоВыбора(Элемент, СтандартнаяОбработка) {
    var Dialog = FileDialog("Укажите расположение выполняемого файла bsl-language-server.exe", "exe", formSettings.pathToBslServer);
    if (Dialog.Choose())
        formSettings.pathToBslServer = Dialog.FullFileName;
}
function pathToBslJsonНачалоВыбора(Элемент, СтандартнаяОбработка) {
    var Dialog = FileDialog("Укажите расположение файла .bsl-language-server.json", "json", formSettings.pathToBslJson);
    if (Dialog.Choose())
        formSettings.pathToBslJson = Dialog.FullFileName;
}
function pathToTempНачалоВыбора(Элемент, СтандартнаяОбработка) {
    var Dialog = DirectoryDialog("Укажите расположение папки для временных файлов", formSettings.PathToTemp);
    if (Dialog.Choose())
        formSettings.PathToTemp = Dialog.Directory + "\\";
}
function FileDialog(title, extension, path) {
    var fileDialog = v8New("FileDialog");
    fileDialog.Title = title;
    fileDialog.Filter = "(*." + extension + ")|*." + extension;
    fileDialog.Directory = v8New("File", path).Path;
    fileDialog.FullFileName = path;
    return fileDialog;
}
function DirectoryDialog(Title, path) {
    var Mode = FileDialogMode.ChooseDirectory;
    var fileDialog = v8New("FileDialog", Mode);
    fileDialog.Title = Title;
    fileDialog.Directory = path;
    return fileDialog;
}
function CmdBarOpenSettings(Кнопка) {
    openFormSettings();
}
function activateLastTextView() {
    if (!parsedTextWindow || !parsedTextWindow.isAlive) {
        // Закрыли окно, попробуем восстановить
        if (mdObjId != '') {
            var mdObj = mdCont.findByUUID(mdObjId);
            if (!mdObjId) {
                MessageBox("Не удалось найти объект метаданных");
                return false;
            }
            parsedTextWindow = mdObj.openModule(mdPropId);
            if (!parsedTextWindow) {
                MessageBox("Не удалось открыть модуль метаданных");
                return false;
            }
        }
        else {
            if (filePath != '') {
                stdlib.openFileIn1C(filePath);
                var tw = snegopat.activeTextWindow();
                if (tw && tw.textDocument && tw.textDocument.UsedFileName == filePath)
                    parsedTextWindow = tw;
                else {
                    MessageBox("Не удалось открыть файл " + filePath);
                    return false;
                }
            }
            else {
                MessageBox("Неизвестно, какой файл открывать");
                return false;
            }
        }
        lastView = windows.getActiveView();
    }
    else {
        lastView.activate();
    }
    return true;
}
function msgListВыбор(Элемент, ВыбраннаяСтрока, Колонка, СтандартнаяОбработка) {
    if (!activateLastTextView())
        return;
    var range = /(\d+):(\d+) - (\d+):(\d+)/.exec(ВыбраннаяСтрока.val.Позиция);
    var startLine = parseInt(range[1]), startCol = parseInt(range[2]), endLine = parseInt(range[3]), endCol = parseInt(range[4]);
    parsedTextWindow.setCaretPos(startLine, startCol);
    parsedTextWindow.setSelection(startLine, startCol, endLine, endCol);
}
stdlib.createMacros(SelfScript.self, "Расширеный анализ текущего модуля", "Вызывает анализ текущего модуля с помощью bsl language server", stdcommands.Frntend.SyntaxCheck.info.picture, function () {
    if (!pathToBslServer || !v8New("File", pathToBslServer).Exist()) {
        openFormSettings();
        return;
    }
    var tw = snegopat.activeTextWindow();
    if (!tw || tw.extName() != "Встроенный язык") {
        if (lastResult)
            openForm();
        else
            MessageBox("Нет активного модуля");
        return;
    }
    var result = runAnalyses(tw.textDocument);
    if (!result)
        return;
    storeCurrentWindow(tw);
    lastResult = result;
    lastSelection = tw.GetSelection();
    fillForm();
    openForm();
}, "Ctrl+Shift+F7");
stdlib.createMacros(SelfScript.self, "Открыть форму", "Открывает форму с текущим анализом модуля", stdcommands.Frame.FileOpen.info.picture, function () {
    openForm();
});
stdlib.createMacros(SelfScript.self, "Настройка", "Открывает форму с настройками скрипта", stdcommands.CfgStore.OpenCfgStoreAdmin.info.picture, function () {
    openFormSettings();
});
