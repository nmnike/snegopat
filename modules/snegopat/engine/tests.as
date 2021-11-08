﻿/*
 * (c) проект "Snegopat.Module", Александр Орефков orefkov@gmail.com
 * Тут всякие запускаемые тесты
 */

// Данные строки нужны только для среды разработки и вырезаются препроцессором
#pragma once
#include "../all.h"

//Packet TestTestTest("TestTestTest", initTestTestTest, piOnMainEnter);

void testReadTextFile() {
}

void testValueToString() {
    Value val = 0.234;
    v8string tt;
    val.toString(tt);
    Message("res=" + tt);
}

void testScriptObject() {
    Message(join(oneAddinMgr.byIdx(0).macroses(), "\n"));
    Variant res = oneAddinMgr.byIdx(0).invokeMacros("DesignScriptForm");
    Value val;
    var2val(res, val);
    v8string str;
    val.getString(str);
    Message(str.str);
}

void testViewParent() {
    oneDesigner._snegopat.activeTextWindow();
}

bool runTest() {
    //testReadTextFile();
    //testValueToString();
    //testScriptObject();
    testViewParent();
    Message("Test");
    return true;
}

bool initTestTestTest() {
    addHotKey('T' | hkCtrl | hkAlt, runTest);
    return true;
}
