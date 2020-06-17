#include <node.h>
#include <node_buffer.h>
#include <v8.h>
#include <nan.h>
#include <cstddef>
#include <cassert>
#include <cstring>

#include "KeccakNISTInterface.h"

#define MAX_DIGEST_SIZE 64
#define ASSERT_IS_STRING_OR_BUFFER(val) \
	if (!val->IsString() && !Buffer::HasInstance(val)) { \
		return Nan::ThrowTypeError("Not a string or buffer"); \
	}

using namespace node;
using namespace v8;
using namespace Node_SHA3;

static void toHex(const char *data_buf, size_t size, char *output);

class SHA3Hash: public ObjectWrap {
private:

	static constexpr size_t state_buf_size = sizeof(hashState) + std::alignment_of<hashState>::value - 1;
	char state_buf[state_buf_size];

	// remove this function in favor of std::align once gcc 5.1 is the minimal required compiler version
	void* align(size_t alignment, size_t size, void*& ptr, size_t& space) {
		return reinterpret_cast<char*>(reinterpret_cast<size_t>(static_cast<char*>(ptr) + (alignment - 1)) & (~alignment + 1));
	}

	SHA3Hash() {
		void* buf = reinterpret_cast<void*>(state_buf);
		size_t buf_size = state_buf_size;
		void* aligned_buf = align(std::alignment_of<hashState>::value, sizeof(hashState), buf, buf_size);
		state = new(aligned_buf) hashState();
	}

	~SHA3Hash()
	{}

	static
	NAN_METHOD(New) {
		SHA3Hash *obj;
		int32_t hashlen;

		hashlen = info[0]->IsUndefined() ? 512 : info[0].As<Int32>()->Value();
		switch (hashlen) {
			case 224:
			case 256:
			case 384:
			case 512:
				break;
			default:
				return Nan::ThrowTypeError("Unsupported hash length");
		}

		if (info.IsConstructCall()) {
			// Invoked as constructor.
			obj = new SHA3Hash();
			obj->Wrap(info.This());
			obj->bitlen = hashlen;
			::Init(obj->state, hashlen);
			info.GetReturnValue().Set(info.This());
		} else {
			// Invoked as a plain function.
			const int argc = 1;
			Local<Value> argv[argc] = { Nan::New<Number>(hashlen) };
			Local<Function> cons = Nan::New<Function>(constructor);
			info.GetReturnValue().Set(Nan::NewInstance(cons, argc, argv).ToLocalChecked());
		}
	}

public:
	hashState* state;
	int32_t bitlen;

	static
	NAN_MODULE_INIT(Init) {
		Local<String> className = Nan::New<String>("SHA3Hash").ToLocalChecked();

		Local<FunctionTemplate> functionTemplate = Nan::New<FunctionTemplate>(New);

		functionTemplate->SetClassName(className);
		functionTemplate->InstanceTemplate()->SetInternalFieldCount(1);

		Nan::SetPrototypeMethod(functionTemplate, "update", Update);
		Nan::SetPrototypeMethod(functionTemplate, "digest", Digest);

		Local<Function> f = Nan::GetFunction(functionTemplate).ToLocalChecked();
		constructor.Reset(f);
		Nan::Set(target, className, f);
	}

	static
	NAN_METHOD(Update) {
		Isolate *isolate = info.GetIsolate();
		Local<Context> context = isolate->GetCurrentContext();
		SHA3Hash *obj = ObjectWrap::Unwrap<SHA3Hash>(info.This());

		ASSERT_IS_STRING_OR_BUFFER(info[0]);
		enum Nan::Encoding enc = static_cast<Nan::Encoding>(ParseEncoding(Isolate::GetCurrent(), info[0], node::BINARY));
		ssize_t len = Nan::DecodeBytes(info[0], enc);

		if (len < 0) {
			return Nan::ThrowError("Bad argument");
		}

		if (Buffer::HasInstance(info[0])) {
			Local<Object> buffer_obj = info[0]->ToObject(context).ToLocalChecked();
			const char *buffer_data = Buffer::Data(buffer_obj);
			size_t buffer_length = Buffer::Length(buffer_obj);
			::Update(obj->state, (const BitSequence *) buffer_data, buffer_length * 8);
		} else {
			char *buf = new char[len];
			ssize_t written = Nan::DecodeWrite(buf, len, info[0], enc);
			assert(written == len);
			::Update(obj->state, (const BitSequence *) buf, len * 8);
			delete[] buf;
		}

		info.GetReturnValue().Set(info.This());
	}

	static
	NAN_METHOD(Digest) {
		SHA3Hash *obj = ObjectWrap::Unwrap<SHA3Hash>(info.This());
		hashState state2;
		unsigned char digest[MAX_DIGEST_SIZE];

		memcpy(&state2, obj->state, sizeof(hashState));
		Final(&state2, digest);

		Local<Value> outString;
		enum Nan::Encoding enc = static_cast<Nan::Encoding>(ParseEncoding(Isolate::GetCurrent(), info[0], node::BINARY));
		if (enc == Nan::HEX) {
			// Hex encoding
			char hexdigest[MAX_DIGEST_SIZE * 2];
			toHex((const char *) digest, obj->bitlen / 8, hexdigest);
			outString = Nan::Encode(hexdigest, obj->bitlen / 4, Nan::BINARY);
		} else if (enc == Nan::BINARY /* || enc == BUFFER */) {
			outString = Nan::Encode(digest, obj->bitlen / 8, enc);
		} else {
			return Nan::ThrowError("Unsupported output encoding");
		}

		info.GetReturnValue().Set(outString);
	}

private:
	static Nan::Persistent<Function> constructor;
};

Nan::Persistent<Function> SHA3Hash::constructor;

static const char hex_chars[] = {
	'0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
	'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
	'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
	'u', 'v', 'w', 'x', 'y', 'z'
};

static void
toHex(const char *data_buf, size_t size, char *output) {
	size_t i;

	for (i = 0; i < size; i++) {
		output[i * 2] = hex_chars[(unsigned char) data_buf[i] / 16];
		output[i * 2 + 1] = hex_chars[(unsigned char) data_buf[i] % 16];
	}
}

NODE_MODULE(sha3, SHA3Hash::Init)
