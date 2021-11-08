﻿// (c) проект "Snegopat.Module", Александр Орефков orefkov@gmail.com
// Описание интерфейсов 1С.

// Описание объекта Строка
:enum EStringSize
#if ver < 8.3
	16 inplaceStringSize
#else
  #if x86 = 1
	10 inplaceStringSize
  #else
    12 inplaceStringSize
  #endif
#endif

:struct v8strData
  :props
    uint refCount
	#if ver < 8.3
		int pad
	#endif
	uint8 text

:class v8string
  // Под x64 тут неоптимальное выравнивание, по 4ём вместо 8
  :align 4
  :props
	uint len
	int_ptr data
	int_ptr pEnd
	int i1
	int i2
#if ver < 8.3
	36
#elif x86 = 1
	24
#endif
  :meths
	void ctor()
	{
		obj.len = 0;
		obj.data = 0;
	}
	---
	void ctor1(const v8string&in other)
	{
		mem::memcpy(obj.self, other.self, v8string_size);
		if (obj.len == inplaceStringSize)
			mem::interlockedIncr(obj.data);
	}
	---
	void ctor3(int_ptr text, size_t l)
	{
		if (l < inplaceStringSize) {
			obj.len = l;
			if (l > 0)
				mem::memcpy(obj.self + v8string_data_offset, text, l * 2);
			mem::word[obj.self + v8string_data_offset + l * 2] = 0;
		} else {
			obj.len = inplaceStringSize;
			uint dataLen = v8strData_text_offset + l * 2;
		  #if ver < 8.3.11
			obj.data = malloc(dataLen + 2);
		  #else
			obj.data = v8malloc(dataLen + 2);
		  #endif
			mem::dword[obj.data] = 1;
			mem::memcpy(obj.data + v8strData_text_offset, text, l * 2);
			obj.pEnd = obj.data + dataLen;
			mem::word[obj.pEnd] = 0;
			obj.i1 = l + 4;
		}
	}
	---
	void dtor()
	{
		if (obj.len == inplaceStringSize && mem::dword[obj.data] == 1 /*0 == mem::interlockedDecr(obj.data)*/) {
		  #if ver < 8.3.11
			free(obj.data);
		  #else
			v8free(obj.data, obj.pEnd - obj.data + 2);
		  #endif
		}
	}
	---
	string opImplConv()const|int_ptr v8string__opImplConv(v8string& obj, string& ret)
	{
		ret.ctor(v8string__get_cstr(obj), v8string__get_length(obj));
		return ret.self;
	}
	---
	int_ptr get_cstr()const
	{
		return obj.len < inplaceStringSize ? obj.self + v8string_data_offset : obj.data + v8strData_text_offset;
	}
	---
	uint get_length()const
	{
		return obj.len < inplaceStringSize ? obj.len : uint(obj.pEnd - (obj.data + v8strData_text_offset)) / 2;
	}
	---
	void opAssign(const v8string&in s)
	{
		if (obj.self != s.self) {
			v8string__dtor(obj);
			v8string__ctor1(obj, s);
		}
	}
	---
	bool isEmpty()const
	{
		return obj.len == 0;
	}
	---
	void opAssign(const string&in s)
	{
		v8string__dtor(obj);
		v8string__ctor3(obj, s.cstr, s.length);
	}
	---
	string get_str()const|int_ptr v8string__get_str(v8string& obj, string& ret)
	{
		ret.ctor(v8string__get_cstr(obj), v8string__get_length(obj));
		return ret.self;
	}
	---

:mixin string
  :meths
	v8string opImplConv()const|int_ptr string__opImplConv(string& obj, v8string& ret)
	{
		v8string__ctor3(ret, obj.cstr, obj.length);
		return ret.self;
	}
	---
