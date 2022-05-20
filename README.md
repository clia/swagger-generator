# Clia Swagger Generator

Clia Swagger Generator is a VSCode extension to generate Swagger description from Rust Web API.

## Example Rust Web API

Below is an example Rust Web API definition. You can generate a Swagger description from this code.

```rust
use ntex::http::StatusCode;
use ntex::web::types::Query;
use ntex::web::{self, Error, HttpRequest, HttpResponse};
use serde::{Deserialize, Serialize};

/// Test interface's query.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestInterfaceQuery {
    /// Name
    pub name: String,
    /// Color
    pub color: String,
}

/// Test interface's response format.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestInterfaceResponse {
    /// Return code
    pub code: i32,
    /// Return message
    pub msg: String,
    /// Return data
    pub data: TestInterfaceData,
}

/// Test interface's data format.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestInterfaceData {
    /// Picture URL
    pub picture: String,
}

/// A test interface.
///
/// @returns TestInterfaceResponse
///
#[web::get("/mp/test-interface")]
pub async fn test_interface(
    req: HttpRequest,
    query: Query<TestInterfaceQuery>,
) -> Result<HttpResponse, Error> {
    println!("{:?}", req);
    println!("name: {:?}", query.name);
    println!("color: {:?}", query.color);

    // response
    Ok(HttpResponse::build(StatusCode::OK)
        .content_type("application/json; charset=utf-8")
        .body(
            r#"{
            "code":0,
            "msg":"success",
            "data":{
                "picture":"https://img.com/adcdke.png"
            }
        }"#,
        ))
}
```
