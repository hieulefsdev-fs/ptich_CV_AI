package com.cvai.backend.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class HtmlEscaperTest {

    @Test
    void escapesDangerousCharacters() {
        assertEquals("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;", HtmlEscaper.escape("<script>alert(\"x\")</script>"));
        assertEquals("Tom &amp; Jerry&#39;s", HtmlEscaper.escape("Tom & Jerry's"));
    }

    @Test
    void keepsVietnameseAndHandlesNull() {
        assertEquals("Lê Đăng Hiếu", HtmlEscaper.escape("Lê Đăng Hiếu"));
        assertEquals("", HtmlEscaper.escape(null));
    }
}
