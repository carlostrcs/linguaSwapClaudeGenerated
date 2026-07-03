using System;
using System.Collections.Generic;
using System.Linq;
using LinguaSwap.Api.Models;
using LinguaSwap.Api.Services;
using Xunit;

namespace LinguaSwap.Tests;

/// <summary>
/// Covers each practice system's word selection (Services/PracticeSelectors). Every selector
/// shuffles the words it keeps, so these assert on the *set* selected (and its size) rather than
/// order — deterministic even with the shuffle.
/// </summary>
public class PracticeSelectorTests
{
    private static readonly DateTime Now = new(2026, 7, 1, 12, 0, 0, DateTimeKind.Utc);

    private static Candidate Word(int id, LearningState? state) =>
        new(new Entry { Id = id }, $"p{id}", $"a{id}", state);

    private static LearningState Seen(int box, DateTime? nextReview, int incorrect = 0) =>
        new() { BoxLevel = box, NextReviewAt = nextReview, IncorrectCount = incorrect };

    private static int[] Ids(IEnumerable<Candidate> cs) => cs.Select(c => c.Entry.Id).OrderBy(i => i).ToArray();

    [Fact]
    public void SmartReview_KeepsAllDueAndNew_DroppingNotYetDue_WhenOverCap()
    {
        // 15 due + 3 never-seen + 7 not-yet-due = 25 candidates; only 20 fit, so all due + all new
        // stay and 5 of the not-yet-due get dropped.
        var due = Enumerable.Range(1, 15).Select(i => Word(i, Seen(1, Now.AddDays(-1)))).ToList();
        var neverSeen = Enumerable.Range(100, 3).Select(i => Word(i, null)).ToList();
        var notYetDue = Enumerable.Range(200, 7).Select(i => Word(i, Seen(2, Now.AddDays(i)))).ToList();
        var all = notYetDue.Concat(neverSeen).Concat(due).ToList();

        var result = new SmartReviewSelector().Select(all, Now);

        Assert.Equal(20, result.Count);
        Assert.Superset(due.Concat(neverSeen).Select(c => c.Entry.Id).ToHashSet(),
            result.Select(c => c.Entry.Id).ToHashSet());
        Assert.Equal(2, result.Count(c => c.Entry.Id >= 200)); // only 2 not-yet-due survive the cap
    }

    [Fact]
    public void LearnNew_ReturnsOnlyNeverSeenWords()
    {
        var all = new[]
        {
            Word(1, null),
            Word(2, Seen(1, Now)),
            Word(3, null),
            Word(4, Seen(3, Now.AddDays(4))),
        };

        var result = new LearnNewSelector().Select(all, Now);

        Assert.Equal(new[] { 1, 3 }, Ids(result));
    }

    [Fact]
    public void LearnNew_IsEmpty_WhenEverythingIsAlreadySeen()
    {
        var all = new[] { Word(1, Seen(1, Now)), Word(2, Seen(2, Now)) };
        Assert.Empty(new LearnNewSelector().Select(all, Now));
    }

    [Fact]
    public void Weak_KeepsLowestBoxes_ExcludesNeverSeen()
    {
        // Seen words with boxes 1..22 plus two never-seen. The 20 lowest boxes (1..20) survive; the
        // two highest boxes and both never-seen words are dropped.
        var seen = Enumerable.Range(1, 22).Select(box => Word(box, Seen(box, Now))).ToList();
        var neverSeen = new[] { Word(100, null), Word(101, null) };
        var all = neverSeen.Concat(seen).ToList();

        var result = new WeakSelector().Select(all, Now);

        Assert.Equal(Enumerable.Range(1, 20).ToArray(), Ids(result));
    }

    [Fact]
    public void Weak_IsEmpty_WhenNothingSeenYet()
    {
        var all = new[] { Word(1, null), Word(2, null) };
        Assert.Empty(new WeakSelector().Select(all, Now));
    }

    [Fact]
    public void Cram_ReturnsEveryWord_WithNoCap()
    {
        var all = Enumerable.Range(1, 25)
            .Select(i => Word(i, i % 2 == 0 ? Seen(1, Now) : null))
            .ToList();

        var result = new CramSelector().Select(all, Now);

        Assert.Equal(25, result.Count);
        Assert.Equal(Enumerable.Range(1, 25).ToArray(), Ids(result));
    }

    [Fact]
    public void Journey_ReturnsEveryWord_InLibraryOrder_NoShuffle()
    {
        // Deliberately out of order; Journey must return them sorted by entry id, uncapped.
        var all = new[] { Word(30, Seen(1, Now)), Word(10, null), Word(20, Seen(3, Now)) }
            .Concat(Enumerable.Range(40, 25).Select(i => Word(i, null)))
            .ToList();

        var result = new JourneySelector().Select(all, Now);

        Assert.Equal(28, result.Count);
        Assert.Equal(result.Select(c => c.Entry.Id).OrderBy(i => i), result.Select(c => c.Entry.Id)); // already ordered
        Assert.Equal(10, result[0].Entry.Id);
    }

    [Theory]
    [InlineData(PracticeMode.SmartReview, true)]
    [InlineData(PracticeMode.LearnNew, true)]
    [InlineData(PracticeMode.Weak, true)]
    [InlineData(PracticeMode.Cram, false)]
    [InlineData(PracticeMode.Journey, false)]
    public void Reschedules_MatchesMode(PracticeMode mode, bool expected)
    {
        var resolver = new PracticeSelectorResolver(new IPracticeSelector[]
        {
            new SmartReviewSelector(), new LearnNewSelector(), new CramSelector(), new WeakSelector(),
            new JourneySelector(),
        });

        var selector = resolver.For(mode);

        Assert.Equal(mode, selector.Mode);
        Assert.Equal(expected, selector.Reschedules);
    }
}
