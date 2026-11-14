package com.readest.native_bridge

import android.util.Log
import android.view.Surface
import android.view.View
import java.lang.reflect.Method

/** One-shot hardware page animation; sending the vendor command plays it immediately. */
internal object EinkPageTurnController {
    private const val TAG = "EinkPageTurn"
    private const val RIPPLE = 1
    private const val WATERFALL = 2
    private const val STANDARD = 1

    val effectTypes = listOf(RIPPLE to "Ripple", WATERFALL to "Waterfall")
    val speeds = listOf(0 to "Fast", STANDARD to "Standard", 2 to "Slow")

    // iReader direction codes for Surface.ROTATION_0..3.
    private val forwardCodes = intArrayOf(1, 4, 2, 3)
    private val backwardCodes = intArrayOf(2, 3, 1, 4)

    // Cache only a confirmed absence. Other reflection failures propagate from
    // the capability probe, allowing the bridge to reject and retry later.
    private val postCommand: Method? by lazy {
        try {
            Class.forName("android.eink.EPDCDevice")
                .getMethod("nativePostCommand", String::class.java)
        } catch (e: ClassNotFoundException) {
            null
        } catch (e: NoSuchMethodException) {
            null
        }
    }

    /** Read-only presence check: this never sends a command to the panel. */
    fun isSupported(): Boolean = postCommand != null

    /** Returns whether the command was sent, not whether the animation has finished. */
    fun play(view: View, effectType: Int?, forward: Boolean, speed: Int?): Boolean {
        val effect = effectType ?: RIPPLE
        val animationSpeed = speed ?: STANDARD
        if (effect !in RIPPLE..WATERFALL || animationSpeed !in 0..2) return false
        return try {
            val method = postCommand ?: return false
            val rotation = view.display?.rotation ?: Surface.ROTATION_0
            // Ripple and waterfall are direction sets, not separate software effects.
            val shift = if (effect == WATERFALL) 1 else 0
            val direction = (if (forward) forwardCodes else backwardCodes)[(rotation + shift) % 4]
            val code = direction or (animationSpeed shl 6)
            method.invoke(null, "next-effect-type $code")
            true
        } catch (t: Throwable) {
            Log.d(TAG, "page animation failed: ${t.message}")
            false
        }
    }
}
