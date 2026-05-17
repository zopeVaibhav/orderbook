use std::collections::HashMap;

use crate::types::{book::Book, market::Market};

pub struct Engine {
    pub markets: HashMap<String, Market>,
    pub books: HashMap<String, Book>,
}
