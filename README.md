# Clia REST Client

Clia REST Client is a personal temporary VSCode plugin, forked from [REST Client](https://github.com/Huachao/vscode-restclient), Thanks!

[使用说明](https://juejin.cn/post/7097792519338524686/)

## Added Features

### URL Signature

URL Signature method like AliYun's: [https://help.aliyun.com/document_detail/30563.htm](https://help.aliyun.com/document_detail/30563.htm).
The signature algorithm is configurable. Configuration contains two parts:

- `Url Sign Configuration`: Configuration for the signature algorithm and names.
- `Url Sign Key Secrets`: Key and secret pairs for use.

You should disable it in the configuration if you don't want to use this function, the default is enabled.

The default configuration is our's use case.

An example AliYun's signature algorithm configuration:

```json
{
    "enableUrlSign": true,
    "algorithm": {
        "step1OrderParams": true,
        "step1UrlEncodeParams": true,
        "step1PercentEncode": true,
        "step1AddEqual": true,
        "step1AddAnd": true,
        "step2SeparatorAnd": true,
        "step2AddHttpMethod": true,
        "step2AddPercentEncodeSlash": true,
        "step2PercentEncode": true,
        "step3ComputeAlgorithm": "hmacsha1",
        "step3SecretAppend": "&",
        "step3TextAlgorithm": "base64"
    },
    "keyParamName": "AccessKeyId",
    "signParamName": "Signature"
}
```

step3ComputeAlgorithm supports: `md5` | `hmacsha1`

step3TextAlgorithm supports: `hex` | `base64`
