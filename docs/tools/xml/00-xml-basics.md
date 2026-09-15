# 📐 XML/XSD Basics — start here before the individual tool pages

## What is XML?

**XML (eXtensible Markup Language)** is a way of writing structured data using labeled,
nested tags — similar to HTML, but designed for *data* rather than web pages. Every piece of
information is wrapped in an opening and closing tag:

```xml
<order>
  <id>1001</id>
  <total>49.99</total>
</order>
```

XML is used heavily in enterprise systems, SOAP web services, banking and government file
formats, RSS/Atom feeds, and configuration files.

## What is an XSD?

An **XSD (XML Schema Definition)** is the *blueprint* or contract for an XML document: it
declares which tags are allowed, what order they must appear in, whether they're required or
optional, and what type of data they can hold (text, number, date...). Think of an XSD as the
"form template" and an XML document as a "filled-in form" — the **XSD & XML Schema
Validator** checks that the filled-in form actually followed the template.

## What is XPath?

**XPath** is a small query language for finding specific pieces of data inside an XML
document — for example, `//order/id` means "find every `id` tag that's inside an `order`
tag, anywhere in the document." Use the **XPath Tester & Evaluator** to experiment with XPath
expressions against real XML.

## What is XSLT?

**XSLT (eXtensible Stylesheet Language Transformations)** is a language for transforming one
XML document into a *different* XML, HTML, or plain-text document, based on a set of
rewrite rules called a "stylesheet." Use the **XSLT Transformer & Tester** to run real
transformations and see the result instantly.

## How the tools in this folder fit together

1. Have example XML but no schema? → **XML to XSD Schema Generator** drafts one for you.
2. Have a schema but need example data? → **XSD to XML Sample Generator** builds one.
3. Need to check a real file follows a schema? → **XSD & XML Schema Validator**.
4. Need to extract or query specific values? → **XPath Tester & Evaluator**.
5. Need to transform one XML shape into another? → **XSLT Transformer & Tester**.
6. Need to safely embed special characters (`<`, `&`, quotes) inside XML content? →
   **XML Entity & CDATA Escaper**.

See the shared [Glossary](../GLOSSARY.md) for quick definitions of XML, XSD, XPath, XSLT,
CDATA, and namespace.

## The XML tools

| Tool | What it does |
|------|---------------|
| [XML to XSD Schema Generator](xml-to-xsd.md) | Drafts a schema from an example document |
| [XSD to XML Sample Generator](xsd-to-xml.md) | Builds a sample document from a schema |
| [XPath Tester & Evaluator](xpath-evaluator.md) | Tests XPath queries against XML |
| [XML Entity & CDATA Escaper](xml-escape-tool.md) | Safely escapes special characters |
| [XSD & XML Schema Validator](xsd-validator.md) | Checks a document against its schema |
| [XSLT Transformer & Tester](xslt-transformer.md) | Runs XSLT transformations live |
